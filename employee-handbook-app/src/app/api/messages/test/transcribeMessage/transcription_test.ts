import axiosInstance from "@/app/axios_config";





async function transcribeMessage(file_path: string): Promise<string> {
    try{
        const audioFile = new Blob([file_path], { type: 'audio/m4a' });
        const formData = new FormData();
        formData.append('file', audioFile);
        const response = await axiosInstance.post(`http://localhost:3000/api/messages/transcribe`, formData);
        return response.data.transcription;
    } catch (error) {
        console.error("Error during transcription:", error);
        throw new Error("Failed to transcribe audio");
    }
}

const res = await transcribeMessage('./src/unittest/transcribeMessage/transcrpt_test_1.m4a')
console.log(res === "Hi I'm recording this to test our voice to text feature"); 

const res2 = await transcribeMessage('./src/unittest/transcribeMessage/transcrpt_test_3.m4a')
console.log(res2 === "What is the minimum wage in Ontario?"); 
