const db = require('./config/db'); // adjust path if needed
const bcrypt = require('bcryptjs');

async function hashAllPasswords() {
    try {
        // Adjust primary key column name here
        const [users] = await db.query('SELECT user_id, password FROM users');

        for (let user of users) {
            // Skip already hashed passwords (optional safety)
            if (!user.password.startsWith('$2')) {
                const hashed = await bcrypt.hash(user.password, 10);
                await db.query('UPDATE users SET password = ? WHERE user_id = ?', [hashed, user.user_id]);
                console.log(`Updated user ${user.user_id}`);
            }
        }

        console.log('All passwords hashed!');
        process.exit(0);
    } catch (err) {
        console.error('Error hashing passwords:', err);
        process.exit(1);
    }
}

hashAllPasswords();
