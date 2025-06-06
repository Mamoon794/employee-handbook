import React from 'react';
import { Users, User } from 'lucide-react';

const containerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100vh',
  fontFamily: 'Montserrat, sans-serif',
  background: '#fff',
};

const headerStyle: React.CSSProperties = {
  alignSelf: 'flex-start',
  margin: '55px 0 0 60px',
  fontWeight: 'bold',
  fontSize: '2rem',
  color: '#2c5282',
  fontStyle: 'italic',
  fontFamily: 'Montserrat, sans-serif',
};

const titleStyle: React.CSSProperties = {
  marginTop: '80px',
  marginBottom: '40px',
  fontWeight: 'bold',
  fontSize: '2rem',
  color: '#2c5282',
  textAlign: 'center',
  fontFamily: 'Montserrat, sans-serif',
};

const cardContainerStyle: React.CSSProperties = {
  display: 'flex',
  gap: '40px',
  marginBottom: '50px',
};

const cardStyle: React.CSSProperties = {
  width: '420px',
  height: '220px',
  border: '1px solid #222',
  borderRadius: '25px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  transition: 'box-shadow 0.2s',
  background: '#fff',
};


const labelStyle: React.CSSProperties = {
  fontSize: '1.5rem',
  fontWeight: 500,
  fontFamily: 'Montserrat, sans-serif',
};

const loginPromptStyle: React.CSSProperties = {
  marginTop: '30px',
  fontWeight: 600,
  fontSize: '1.2rem',
  fontFamily: 'Montserrat, sans-serif',
};

const loginButtonStyle: React.CSSProperties = {
  marginTop: '20px',
  marginBottom: '60px',
  background: '#23398D',
  color: '#fff',
  border: 'none',
  borderRadius: '30px',
  padding: '15px 45px',
  fontSize: '1.2rem',
  fontWeight: 500,
  cursor: 'pointer',
  fontFamily: 'Montserrat, sans-serif',
}; 

const SignUp: React.FC = () => {
  return (
    <div style={containerStyle}>
      <div style={headerStyle}>Gail</div>
      <div style={titleStyle}>Register to get started</div>
      <div style={cardContainerStyle}>
        <div style={cardStyle}>
            <Users size={64} />
          <div style={labelStyle}>Continue as employee</div>
        </div>
        <div style={cardStyle}>
            <User size={64} />
          <div style={labelStyle}>Continue as Employer</div>
        </div>
      </div>
      <div style={loginPromptStyle}>Already have an account?</div>
      <button style={loginButtonStyle}>Log in</button>
    </div>
  );
};

export default SignUp;
