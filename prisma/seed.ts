import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Start seeding ...')

    // 1. Create a test user
    const email = 'test@example.com'
    const name = 'Test User'

    // Upsert ensures we don't error if running seed multiple times
    const user = await prisma.user.upsert({
        where: { email },
        update: {},
        create: {
            email,
            name,
            image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=test',
            emailVerified: new Date(),
        },
    })

    console.log(`Created user with id: ${user.id}`)

    // 2. Create an example form for this user
    const form = await prisma.form.create({
        data: {
            title: 'My First Scheduled Form',
            userId: user.id,
            fieldsJson: [
                {
                    id: 'field-1',
                    type: 'short-text',
                    label: 'What is your name?',
                    required: true,
                },
                {
                    id: 'field-2',
                    type: 'date',
                    label: 'Preferred Date',
                    required: false,
                }
            ],
            // Example of the new scheduling fields
            closesAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // Closes in 7 days
            isClosed: false,
            closedMessage: 'Sorry, this form is currently closed.',
        },
    })

    console.log(`Created form with id: ${form.id}`)
    console.log('Seeding finished.')
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
