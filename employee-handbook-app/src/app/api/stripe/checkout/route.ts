import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import Stripe from "stripe"
import { getClerkUser, getAllUsers } from "@/models/dbOperations"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-07-30.basil',
});

const pricingTiers = [
  { min: 1, max: 9, price: 1.00 },
  { min: 10, max: 49, price: 0.90 },
  { min: 50, max: 99, price: 0.80 },
  { min: 100, max: 499, price: 0.70 },
  { min: 500, max: 999, price: 0.60 },
  { min: 1000, max: 4999, price: 0.50 },
  { min: 5000, max: 9999, price: 0.40 },
  { min: 10000, max: 19999, price: 0.35 },
  { min: 20000, max: 49999, price: 0.30 },
  { min: 50000, max: 99999, price: 0.25 },
];


const getPricingForEmployeeCount = (count: number) => {
  const tier = pricingTiers.find(tier => count >= tier.min && count <= tier.max);
  return tier ? tier.price : pricingTiers[pricingTiers.length - 1].price;
};

const calculateMonthlyTotal = (count: number) => {
  if (count === 0) return 0;
  const pricePerEmployee = getPricingForEmployeeCount(count);
  return count * pricePerEmployee;
};

export async function POST() {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const users = await getClerkUser(userId);
    if (!users || users.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const user = users[0];
    const companyId = user.companyId;

    if (!companyId) {
      return NextResponse.json({ error: "No company associated with user" }, { status: 400 })
    }

    const allUsers = await getAllUsers(companyId, "firstName");
    const employees = allUsers.filter((user: { userType: string }) => user.userType === 'Employee');
    const employeeCount = employees.length;

    if (employeeCount === 0) {
      return NextResponse.json({ error: "No employees found in organization" }, { status: 400 })
    }

    const monthlyTotal = calculateMonthlyTotal(employeeCount);
    const unitAmount = Math.round(monthlyTotal * 100); // Convert to cents

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "cad",
            product_data: {
              name: "Employee Handbook Premium Access",
              description: `Monthly subscription for ${employeeCount} employees at $${getPricingForEmployeeCount(employeeCount).toFixed(2)} per employee`,
            },
            unit_amount: unitAmount,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
      }/dashboard?success=true`,
      cancel_url: `${
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
      }/dashboard?canceled=true`,
      metadata: {
        userId: userId,
        companyId: companyId,
        employeeCount: employeeCount.toString(),
        monthlyTotal: monthlyTotal.toFixed(2),
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error("Error creating checkout session:", error)
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    )
  }
}
