import 'dotenv/config';
import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function main() {
  try {
    const response = await client.responses.create({
      model: 'gpt-5.6',
      input: 'Você é o ProfitGuard AI. Responda em português brasileiro: em uma frase, diga o que você pode fazer.',
    });
    console.log('\n🤖 ProfitGuard AI:\n');
    console.log(response.output_text);
    console.log();
  }
  catch (error) {
    console.error('\n❌ Erro ao chamar a OpenAI:\n');
    console.error(error);
  }
}

main();
