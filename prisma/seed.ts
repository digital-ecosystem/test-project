import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const questions = [
    {
      text: 'What type of document do you need to prepare and sign?',
      options: [
        { label: 'Sales contract', value: 'sales_contract' },
        { label: 'Employment contract', value: 'employment_contract' },
        { label: 'NDA / confidentiality agreement', value: 'nda' },
        { label: 'Other legal agreement', value: 'other' },
      ],
    },
    {
      text: 'How many parties must sign this document?',
      options: [
        { label: 'Just me', value: 'just_me' },
        { label: 'Two parties', value: 'two' },
        { label: 'Three-to-five parties', value: 'three_five' },
        { label: 'More than five parties', value: 'more_than_five' },
      ],
    },
    {
      text: 'How complex is the agreement?',
      options: [
        { label: 'Standard template, minimal edits', value: 'standard' },
        { label: 'Mostly standard with a few custom clauses', value: 'semi_custom' },
        { label: 'Highly customized document', value: 'custom' },
        { label: 'Not sure yet', value: 'not_sure' },
      ],
    },
    {
      text: 'When do you need the final signed document?',
      options: [
        { label: 'Within 24 hours', value: 'urgent' },
        { label: 'Two–three days', value: 'two_three_days' },
        { label: 'Within a week', value: 'week' },
        { label: 'Flexible / no rush', value: 'flexible' },
      ],
    },
    {
      text: 'Which additional services interest you?',
      options: [
        { label: 'AI clause suggestions', value: 'ai_clauses' },
        { label: 'Expert legal review', value: 'legal_review' },
        { label: 'Priority customer support', value: 'priority_support' },
        { label: 'None of these', value: 'none' },
      ],
    },
  ];

  for (const q of questions) {
    const question = await prisma.question.create({
      data: {
        text: q.text,
        options: {
          create: q.options,
        },
      },
    });
    console.log(`Created question: ${question.text}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

  // run with: npx prisma db seed