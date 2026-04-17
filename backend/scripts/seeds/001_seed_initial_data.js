const bcrypt = require('bcrypt');

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  // 0. Töröljük a meglévő adatokat, hogy tiszta lappal induljunk (sorrend fontos a Foreign Key-k miatt)
  await knex('post_attachments').del();
  await knex('calendar_events').del();
  await knex('posts').del();
  await knex('forums').del();
  await knex('users').del();
  await knex('enrollments').del();
  await knex('universities').del();

  // 1. Egyetemek felvitele (Universities)
  const universities = await knex('universities').insert([
    { name: 'SAPIENTIA EMTE', description: 'Sapientia Erdélyi Magyar Tudományegyetem' }
  ]).returning('id');

  const sapientiaId = universities[0].id;

  // 2. Szakok felvitele (Enrollments)
  const enrollments = await knex('enrollments').insert([
    { name: 'Mérnökinformatikus BSc', description: 'Hardver és szoftver fejlesztés.', university_id: sapientiaId },
    { name: 'Gazdaságinformatikus BSc', description: 'Informatika az üzleti folyamatokban.', university_id: sapientiaId }
  ]).returning('id');

  const mernokId = enrollments[0].id;
  const gazdasagId = enrollments[1].id;

  // 3. Felhasználók felvitele (Users)
  const passwordHash = await bcrypt.hash('secret', 10);
  const users = await knex('users').insert([
    { username: 'admin', email: 'admin@test.com', password: passwordHash, role: 'ADMIN', enrollment_id: null, university_id: sapientiaId, year: null },
    { username: 'student_1', email: 'student1@test.com', password: passwordHash, role: 'USER', enrollment_id: mernokId, university_id: sapientiaId, year: 2 },
    { username: 'student_2', email: 'student2@test.com', password: passwordHash, role: 'USER', enrollment_id: gazdasagId, university_id: sapientiaId, year: 1 }
  ]).returning('id');

  const adminId = users[0].id;
  const student1Id = users[1].id;

  // 4. Tantárgyak / Fórumok felvitele
  const forums = await knex('forums').insert([
    { name: 'Programozás Alapjai I', description: 'C és C++ alapok', enrollment_id: mernokId, university_id: sapientiaId },
    { name: 'Adatbázisok', description: 'SQL és NoSQL alapok', enrollment_id: mernokId, university_id: sapientiaId },
    { name: 'Vállalati gazdaságtan', description: 'Alapvető közgazdaságtan', enrollment_id: gazdasagId, university_id: sapientiaId }
  ]).returning('id');

  const prog1Id = forums[0].id;

  // 5. Posztok felvitele (Posts)
  const posts = await knex('posts').insert([
    { 
      forum_id: prog1Id, 
      author_id: adminId, 
      title: 'C++ Cheat Sheet', 
      description: 'Egy rövid összefoglaló a mutatókról', 
      content: 'A mutatók memóriacímeket tárolnak. Példa: int* ptr = &valtozo;'
    },
    { 
      forum_id: prog1Id, 
      author_id: student1Id, 
      title: 'Kérdés a ZH-val kapcsolatban', 
      description: 'Tudja valaki mettől meddig lesz az anyag?', 
      content: 'Azt hallottam, hogy a dinamikus memóriakezelés még benne lesz. Igaz ez?'
    }
  ]).returning('id');

  const cheatSheetPostId = posts[0].id;

  // 6. Mellékletek felvitele (Post Attachments)
  await knex('post_attachments').insert([
    {
      post_id: cheatSheetPostId,
      file_name: 'c_cpp_mutatok_osszefoglalo.pdf',
      file_url: '/uploads/attachments/c_cpp_mutatok_osszefoglalo.pdf',
      file_type: 'application/pdf'
    },
    {
      post_id: cheatSheetPostId,
      file_name: 'peldak.txt',
      file_url: '/uploads/attachments/peldak.txt',
      file_type: 'text/plain'
    }
  ]);

  // 7. Naptár események (Calendar Events)
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);

  await knex('calendar_events').insert([
    {
      title: 'Közös gyakorlás Programozásból',
      description: 'Találkozunk a könyvtárban és átnézzük a C++ mutatókat a ZH-ra.',
      start_time: now,
      end_time: tomorrow,
      created_by: student1Id,
      forum_id: prog1Id, // Kifejezetten a Prog 1 tárgyhoz
      enrollment_id: mernokId
    }
  ]);
};
