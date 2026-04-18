const bcrypt = require('bcrypt');

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  // 0. Töröljük a meglévő adatokat, hogy tiszta lappal induljunk (sorrend fontos a Foreign Key-k miatt)
  await knex('post_attachments').del();
  await knex('calendar_events').del();
  await knex('comments').del();
  await knex('posts').del();
  await knex('forums').del();
  await knex('users').del();
  await knex('enrollments').del();
  await knex('universities').del();

  // 1. Egyetemek felvitele (Universities)
  const universities = await knex('universities').insert([
    { name: 'SAPIENTIA EMTE', description: 'Sapientia Erdélyi Magyar Tudományegyetem' },
    { name: 'UBB', description: 'Babeș-Bolyai Tudományegyetem' },
    { name: 'UTCN', description: 'Kolozsvári Műszaki Egyetem (TU Cluj-Napoca)' }
  ]).returning('id');

  const sapientiaId = universities[0].id;
  const ubbId = universities[1].id;
  const utcnId = universities[2].id;

  // 2. Szakok felvitele (Enrollments)
  const enrollments = await knex('enrollments').insert([
    // Sapientia
    { name: 'Mérnökinformatikus BSc', description: 'Hardver és szoftver fejlesztés.', university_id: sapientiaId },
    { name: 'Gazdaságinformatikus BSc', description: 'Informatika az üzleti folyamatokban.', university_id: sapientiaId },
    // UBB
    { name: 'Informatika BSc (magyar)', description: 'Elméleti és gyakorlati informatika képzés.', university_id: ubbId },
    { name: 'Pszichológia BSc', description: 'Lélektani tanulmányok és kutatás.', university_id: ubbId },
    // UTCN
    { name: 'Automatizálás és Alkalmazott Informatika', description: 'Irányítástechnika és beágyazott rendszerek.', university_id: utcnId }
  ]).returning('id');

  const mernokId = enrollments[0].id;
  const gazdasagId = enrollments[1].id;
  const ubbInfoId = enrollments[2].id;
  const pszichoId = enrollments[3].id;
  const autoId = enrollments[4].id;

  // 3. Felhasználók felvitele (Users)
  const passwordHash = await bcrypt.hash('secret', 10);
  const users = await knex('users').insert([
    // Sapi Admins
    { username: 'admin', email: 'admin@test.com', password: passwordHash, role: 'ADMIN', enrollment_id: null, university_id: sapientiaId, year: null },
    { username: 'moderator_sapi', email: 'mod_sapi@test.com', password: passwordHash, role: 'LESSADMIN', enrollment_id: null, university_id: sapientiaId, year: null },
    
    // UBB Admin
    { username: 'moderator_ubb', email: 'mod_ubb@test.com', password: passwordHash, role: 'LESSADMIN', enrollment_id: null, university_id: ubbId, year: null },

    // Students
    { username: 'sapi_student_1', email: 'student1@sapi.com', password: passwordHash, role: 'USER', enrollment_id: mernokId, university_id: sapientiaId, year: 2 },
    { username: 'sapi_student_2', email: 'student2@sapi.com', password: passwordHash, role: 'USER', enrollment_id: gazdasagId, university_id: sapientiaId, year: 1 },
    { username: 'ubb_student_1', email: 'student1@ubb.com', password: passwordHash, role: 'USER', enrollment_id: ubbInfoId, university_id: ubbId, year: 3 },
    { username: 'ubb_student_2', email: 'student2@ubb.com', password: passwordHash, role: 'USER', enrollment_id: pszichoId, university_id: ubbId, year: 1 },
    { username: 'utcn_student_1', email: 'student1@utcn.com', password: passwordHash, role: 'USER', enrollment_id: autoId, university_id: utcnId, year: 4 }
  ]).returning('id');

  const adminId = users[0].id;
  const sapiModId = users[1].id;
  const ubbModId = users[2].id;
  const sapiStud1Id = users[3].id;
  const ubbStud1Id = users[5].id;

  // 4. Tantárgyak / Fórumok felvitele
  const forums = await knex('forums').insert([
    // Sapientia Forums
    { name: 'Programozás Alapjai I', description: 'C és C++ alapok', enrollment_id: mernokId, university_id: sapientiaId },
    { name: 'Adatbázisok', description: 'SQL és NoSQL alapok', enrollment_id: mernokId, university_id: sapientiaId },
    { name: 'Vállalati gazdaságtan', description: 'Alapvető közgazdaságtan', enrollment_id: gazdasagId, university_id: sapientiaId },
    
    // UBB Forums
    { name: 'Algoritmusok és Adatszerkezetek', description: 'Hatékony algoritmusok tervezése', enrollment_id: ubbInfoId, university_id: ubbId },
    { name: 'Bevezetés a Pszichológiába', description: 'A lélektan alapvető irányzatai', enrollment_id: pszichoId, university_id: ubbId },

    // UTCN Forums
    { name: 'Irányítástechnika', description: 'PID szabályozók és rendszermodellezés', enrollment_id: autoId, university_id: utcnId }
  ]).returning('id');

  const prog1Id = forums[0].id;
  const algoId = forums[3].id;

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
      author_id: sapiStud1Id, 
      title: 'Kérdés a ZH-val kapcsolatban', 
      description: 'Tudja valaki mettől meddig lesz az anyag?', 
      content: 'Azt hallottam, hogy a dinamikus memóriakezelés még benne lesz. Igaz ez?'
    },
    {
      forum_id: algoId,
      author_id: ubbStud1Id,
      title: 'O-notation segítség',
      description: 'Nem értem a logaritmikus futásidőt',
      content: 'Valaki elmagyarázná, miért O(log n) a binary search?'
    }
  ]).returning('id');

  const cheatSheetPostId = posts[0].id;


  // 7. Naptár események (Calendar Events)
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);

  await knex('calendar_events').insert([
    {
      title: 'Sapientia Prog ZH',
      description: 'Programozás alapjai I. félévközi dolgozat',
      start_time: tomorrow,
      end_time: new Date(tomorrow.getTime() + 2 * 60 * 60 * 1000),
      created_by: adminId,
      forum_id: prog1Id,
      enrollment_id: mernokId
    },
    {
      title: 'UBB Algo Konzultáció',
      description: 'Online konzultáció az algoritmusok bonyolultságáról',
      start_time: now,
      end_time: new Date(now.getTime() + 1 * 60 * 60 * 1000),
      created_by: ubbModId,
      forum_id: algoId,
      enrollment_id: ubbInfoId
    }
  ]);

  // 8. Hozzászólások felvitele (Comments)
  await knex('comments').insert([
    {
      post_id: cheatSheetPostId,
      author_id: sapiStud1Id,
      content: 'Ez szuper hasznos, köszönöm szépen!'
    },
    {
      post_id: cheatSheetPostId,
      author_id: sapiModId,
      content: 'Kiegészítettem a fájlt egy extra példával is.'
    }
  ]);
};
