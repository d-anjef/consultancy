import { connectDatabase, disconnectDatabase } from '../config/database.js';
import { UserModel } from '../src/modules/users/user.model.js';
import { logger } from '../src/lib/logger.js';

async function main() {
  try {
    await connectDatabase();
    const result = await UserModel.deleteMany({
      email: { $regex: /^admin2/i },
    });
    logger.info(`Deleted ${result.deletedCount} users with wrong email`);
    await disconnectDatabase();
    process.exit(0);
  } catch (error) {
    logger.fatal({ error }, 'Failed');
    process.exit(1);
  }
}

main();