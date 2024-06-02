const { GoogleGenerativeAI } = require('@google/generative-ai');
const express = require('express');
require('dotenv').config();
const app = express();
app.use(express.json())
const port = 3000;

const genAi = new GoogleGenerativeAI(process.env.GEMINI_API);

function extractJsonString(responseText) {
    const startIndex = responseText.indexOf('```json');
    if (startIndex !== -1) {
        const endIndex = responseText.indexOf('```', startIndex + 7);
        if (endIndex !== -1) {
            return responseText.substring(startIndex + 7, endIndex).trim();
        }
    }
    const temp = responseText.trim();
    return temp;
}

app.post('/gemini', async (req, res) => {
    const { topic, difficulty, noOfQuestions } = req.body;
    if (!topic || !difficulty || !noOfQuestions) {
        res.send("None");
    }
    console.log(topic, noOfQuestions, difficulty)
    const model = await genAi.getGenerativeModel({ model: "gemini-pro" })
    const prompt =
        `Generate ${noOfQuestions} questions on the topic "${topic}" of ${difficulty} difficulty in JSON format, strictly adhering to the following format:
        \n[\n{\nquestion: \"\",\noptions: [\n\"\",\n\"\",\n\"\",\n\"\"\n],\nanswer: \"<1 or 2 or 3 or 4>\"\n}\n]. Note that use single quote between the double quotes of the question or option instead of double quote, if there so that I can parse them properly.
        `

    const result = await model.generateContent(prompt);
    const response = await result.response.candidates[0].content.parts[0].text.toString();
    const jsonString = extractJsonString(response);
    const parsedResponse = await JSON.parse(jsonString);
    let questions = []
    let options = []
    let answers = []

    await parsedResponse.forEach(async item => {
        questions.push(item.question);
        let temp = [];
        await item.options.forEach(option => {
            temp.push(option);
        })
        options.push(temp);
        answers.push(item.answer);
    });

    const body = {
        questions, options, answers
    }

    res.send(body);
})

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
