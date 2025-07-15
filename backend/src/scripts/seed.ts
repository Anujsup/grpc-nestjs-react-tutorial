import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import { User } from '../entities/user.entity';
import * as bcrypt from 'bcryptjs';

// Load environment variables
config();

// Create data source for seeding
const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'simple_app',
  entities: [User],
  synchronize: true,
  logging: true,
});

async function seedAdminUser() {
  try {
    console.log('🌱 Starting database seeding...\n');

    // Initialize database connection
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    const userRepository = AppDataSource.getRepository(User);

    // Check if admin user already exists
    const existingAdmin = await userRepository.findOne({
      where: { username: 'admin' }
    });

    if (existingAdmin) {
      console.log('⚠️  Admin user already exists!');
      console.log(`   Username: ${existingAdmin.username}`);
      console.log(`   Email: ${existingAdmin.email}`);
      console.log(`   Created: ${existingAdmin.created_at}`);
      return;
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash('admin', 10);

    // Create admin user
    const adminUser = userRepository.create({
      username: 'admin',
      email: 'admin@example.com',
      password: hashedPassword,
    });

    // Save to database
    const savedUser = await userRepository.save(adminUser);

    console.log('✅ Admin user created successfully!');
    console.log(`   Username: ${savedUser.username}`);
    console.log(`   Email: ${savedUser.email}`);
    console.log(`   ID: ${savedUser.id}`);
    console.log(`   Created: ${savedUser.created_at}`);

    console.log('\n🎯 Login credentials:');
    console.log('   Username: admin');
    console.log('   Password: admin');

  } catch (error) {
    console.error('❌ Error seeding admin user:', error);
    process.exit(1);
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
    process.exit(0);
  }
}

async function createTestUsers() {
  try {
    console.log('🌱 Creating test users...\n');

    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    const userRepository = AppDataSource.getRepository(User);

    const testUsers = [
      { username: 'admin', email: 'admin@example.com', password: 'admin' },
      { username: 'user1', email: 'user1@example.com', password: 'user1' },
      { username: 'testuser', email: 'test@example.com', password: 'testuser' },
    ];

    for (const userData of testUsers) {
      // Check if user already exists
      const existingUser = await userRepository.findOne({
        where: { username: userData.username }
      });

      if (existingUser) {
        console.log(`⚠️  User '${userData.username}' already exists - skipping`);
        continue;
      }

      // Hash password and create user
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const user = userRepository.create({
        username: userData.username,
        email: userData.email,
        password: hashedPassword,
      });

      const savedUser = await userRepository.save(user);
      console.log(`✅ Created user: ${savedUser.username} (${savedUser.email})`);
    }

    console.log('\n🎯 Test users created! Login credentials:');
    testUsers.forEach(user => {
      console.log(`   ${user.username} / ${user.password}`);
    });

  } catch (error) {
    console.error('❌ Error creating test users:', error);
    process.exit(1);
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
    process.exit(0);
  }
}

// Parse command line arguments
const command = process.argv[2];

switch (command) {
  case 'admin':
    seedAdminUser();
    break;
  case 'users':
    createTestUsers();
    break;
  default:
    console.log('Usage:');
    console.log('  npm run seed:admin  - Create admin user (username: admin, password: admin)');
    console.log('  npm run seed:users  - Create multiple test users');
    process.exit(1);
} 