const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const Employee = require('./models/employeeModel');

// bcrypt is no longer needed here as the model handles hashing via pre-save hook

dotenv.config();

const createAdminUser = async () => {
    try {
        await connectDB();

        const email = 'grigolocri004@gmail.com';
        const password = '1234ok';

        const employeeExists = await Employee.findOne({ email });

        if (employeeExists) {
            console.log('Utente dipendente già esistente.');
            process.exit();
        }

        const employee = new Employee({
            email,
            password, // Pass plain password, the model's pre-save hook will hash it
        });

        await employee.save();
        console.log('Utente dipendente creato con successo!');
        process.exit();

    } catch (error) {
        console.error(`Errore durante la creazione dell'utente: ${error.message}`);
        process.exit(1);
    }
};

createAdminUser();
