import { eq, and, or, like } from 'drizzle-orm';
import { db } from './db';
import { demoUsers, type User, type NewUser } from './db/schema';

/**
 * Drizzle ORM CRUD Demo
 * Demonstrates Create, Read, Update, Delete operations with detailed logging
 */
async function drizzleDemo() {
  console.log('🚀 Starting Drizzle ORM CRUD Demo\n');
  console.log('═'.repeat(60));

  try {
    // ============================================
    // CREATE Operations
    // ============================================
    console.log('\n📝 CREATE Operations');
    console.log('─'.repeat(60));

    // Create single user
    console.log('\n1. Creating a single user...');
    const [user1] = await db
      .insert(demoUsers)
      .values({ 
        name: 'John Doe', 
        email: 'john.doe@example.com' 
      })
      .returning();
    
    console.log('✅ User created:', JSON.stringify(user1, null, 2));

    // Create multiple users
    console.log('\n2. Creating multiple users...');
    const newUsers: NewUser[] = [
      { name: 'Jane Smith', email: 'jane.smith@example.com' },
      { name: 'Bob Johnson', email: 'bob.johnson@example.com' },
      { name: 'Alice Williams', email: 'alice.williams@example.com' },
    ];

    const createdUsers = await db
      .insert(demoUsers)
      .values(newUsers)
      .returning();
    
    console.log(`✅ Created ${createdUsers.length} users:`);
    createdUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.name} (${user.email})`);
    });

    // ============================================
    // READ Operations
    // ============================================
    console.log('\n\n📖 READ Operations');
    console.log('─'.repeat(60));

    // Read all users
    console.log('\n1. Reading all users...');
    const allUsers = await db.select().from(demoUsers);
    console.log(`✅ Found ${allUsers.length} total users`);

    // Read single user by ID
    console.log('\n2. Reading user by ID...');
    const userById = await db
      .select()
      .from(demoUsers)
      .where(eq(demoUsers.id, user1.id));
    
    if (userById[0]) {
      console.log('✅ User found:', JSON.stringify(userById[0], null, 2));
    }

    // Read user by email
    console.log('\n3. Reading user by email...');
    const userByEmail = await db
      .select()
      .from(demoUsers)
      .where(eq(demoUsers.email, 'jane.smith@example.com'));
    
    if (userByEmail[0]) {
      console.log('✅ User found:', JSON.stringify(userByEmail[0], null, 2));
    }

    // Read with LIKE query
    console.log('\n4. Reading users with name containing "John"...');
    const usersWithJohn = await db
      .select()
      .from(demoUsers)
      .where(like(demoUsers.name, '%John%'));
    
    console.log(`✅ Found ${usersWithJohn.length} users:`);
    usersWithJohn.forEach(user => {
      console.log(`   - ${user.name} (${user.email})`);
    });

    // Read with AND condition
    console.log('\n5. Reading users with complex conditions...');
    const filteredUsers = await db
      .select()
      .from(demoUsers)
      .where(
        and(
          like(demoUsers.name, '%John%'),
          eq(demoUsers.email, 'john.doe@example.com')
        )
      );
    
    console.log(`✅ Found ${filteredUsers.length} users matching criteria`);

    // ============================================
    // UPDATE Operations
    // ============================================
    console.log('\n\n✏️  UPDATE Operations');
    console.log('─'.repeat(60));

    // Update single user
    console.log('\n1. Updating user name...');
    const [updatedUser] = await db
      .update(demoUsers)
      .set({ name: 'John Updated Doe' })
      .where(eq(demoUsers.id, user1.id))
      .returning();
    
    if (updatedUser) {
      console.log('✅ User updated:', JSON.stringify(updatedUser, null, 2));
    }

    // Update multiple users
    console.log('\n2. Updating multiple users (adding suffix)...');
    const usersToUpdate = await db
      .select()
      .from(demoUsers)
      .where(like(demoUsers.name, '%Smith%'));
    
    for (const user of usersToUpdate) {
      const [updated] = await db
        .update(demoUsers)
        .set({ name: `${user.name} (Updated)` })
        .where(eq(demoUsers.id, user.id))
        .returning();
      
      if (updated) {
        console.log(`   ✅ Updated: ${updated.name}`);
      }
    }

    // ============================================
    // DELETE Operations
    // ============================================
    console.log('\n\n🗑️  DELETE Operations');
    console.log('─'.repeat(60));

    // Delete single user
    console.log('\n1. Deleting user by ID...');
    const deleteResult = await db
      .delete(demoUsers)
      .where(eq(demoUsers.id, user1.id))
      .returning();
    
    if (deleteResult.length > 0) {
      console.log(`✅ Deleted user: ${deleteResult[0].name}`);
    }

    // Delete multiple users
    console.log('\n2. Deleting users with name containing "Johnson"...');
    const usersToDelete = await db
      .select()
      .from(demoUsers)
      .where(like(demoUsers.name, '%Johnson%'));
    
    for (const user of usersToDelete) {
      await db
        .delete(demoUsers)
        .where(eq(demoUsers.id, user.id));
      console.log(`   ✅ Deleted: ${user.name}`);
    }

    // ============================================
    // Final Summary
    // ============================================
    console.log('\n\n📊 Final Summary');
    console.log('─'.repeat(60));
    
    const remainingUsers = await db.select().from(demoUsers);
    console.log(`\n✅ Remaining users in database: ${remainingUsers.length}`);
    
    if (remainingUsers.length > 0) {
      console.log('\nRemaining users:');
      remainingUsers.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.name} (${user.email}) - ID: ${user.id}`);
      });
    }

    console.log('\n' + '═'.repeat(60));
    console.log('✨ CRUD Demo completed successfully!');
    console.log('═'.repeat(60) + '\n');

  } catch (error) {
    console.error('\n❌ Error during CRUD operations:');
    if (error instanceof Error) {
      console.error(`   Message: ${error.message}`);
      console.error(`   Stack: ${error.stack}`);
    } else {
      console.error('   Unknown error:', error);
    }
    process.exit(1);
  }
}

// Run the demo
drizzleDemo();
