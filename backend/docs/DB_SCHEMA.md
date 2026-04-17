# Adatbázis Séma Dokumentáció - Hackathon Backend

Ez a dokumentum tartalmazza a PostgreSQL adatbázis tábláinak és mezőinek részletes leírását. Minden tábla `uuid` típusú elsődleges kulcsot használ, amely alapértelmezetten generálódik.

---

## 1. `universities` (Egyetemek)
Az intézményeket tároló fő tábla.
| Mező | Típus | Leírás |
| :--- | :--- | :--- |
| `id` | UUID (PK) | Egyedi azonosító |
| `name` | String | Az egyetem neve (pl. SAPIENTIA EMTE) |
| `description` | Text | Rövid leírás az intézményről |
| `created_at` | Timestamp | Létrehozás ideje |
| `updated_at` | Timestamp | Utolsó módosítás ideje |

## 2. `enrollments` (Szakok)
Az egyetemekhez tartozó képzések.
| Mező | Típus | Leírás |
| :--- | :--- | :--- |
| `id` | UUID (PK) | Egyedi azonosító |
| `university_id` | UUID (FK) | Kapcsolat az `universities` táblához (CASCADE) |
| `name` | String | A szak neve (pl. Mérnökinformatikus BSc) |
| `description` | Text | Szak leírása |
| `created_at` | Timestamp | Létrehozás ideje |
| `updated_at` | Timestamp | Utolsó módosítás ideje |

## 3. `users` (Felhasználók)
Hallgatók és adminisztrátorok adatai.
| Mező | Típus | Leírás |
| :--- | :--- | :--- |
| `id` | UUID (PK) | Egyedi azonosító |
| `university_id` | UUID (FK) | Kapcsolat az `universities` táblához |
| `enrollment_id` | UUID (FK) | Kapcsolat az `enrollments` táblához (SET NULL) |
| `username` | String (Unique)| Felhasználónév |
| `email` | String (Unique) | E-mail cím |
| `password` | String | Bcrypt hash-elt jelszó |
| `role` | String | Szerepkör: `ADMIN`, `LESSADMIN`, `USER` |
| `year` | Integer | Évfolyam (pl. 1, 2, 3) |
| `created_at` | Timestamp | Regisztráció ideje |
| `updated_at` | Timestamp | Utolsó módosítás ideje |

## 4. `forums` (Tantárgyak / Kurzusok)
Egy-egy tantárgynak megfelelő fórumcsoport.
| Mező | Típus | Leírás |
| :--- | :--- | :--- |
| `id` | UUID (PK) | Egyedi azonosító |
| `university_id` | UUID (FK) | Kapcsolat az `universities` táblához |
| `enrollment_id` | UUID (FK) | Kapcsolat az `enrollments` táblához |
| `name` | String | Tantárgy neve (pl. Adatbázisok) |
| `description` | Text | Tantárgy leírása |
| `created_at` | Timestamp | Létrehozás ideje |
| `updated_at` | Timestamp | Utolsó módosítás ideje |

## 5. `posts` (Bejegyzések)
A fórumokban létrehozott posztok vagy jegyzetek.
| Mező | Típus | Leírás |
| :--- | :--- | :--- |
| `id` | UUID (PK) | Egyedi azonosító |
| `forum_id` | UUID (FK) | Kapcsolat a `forums` táblához |
| `author_id` | UUID (FK) | Kapcsolat a `users` táblához |
| `title` | String | Poszt címe |
| `description` | Text | Rövid leírás |
| `content` | Text | A bejegyzés teljes tartalma |
| `created_at` | Timestamp | Létrehozás ideje |
| `updated_at` | Timestamp | Utolsó módosítás ideje |

## 6. `post_attachments` (Mellékletek)
A posztokhoz feltöltött fájlok (PDF, képek stb.).
| Mező | Típus | Leírás |
| :--- | :--- | :--- |
| `id` | UUID (PK) | Egyedi azonosító |
| `post_id` | UUID (FK) | Kapcsolat a `posts` táblához |
| `file_name` | String | Az eredeti fájlnév |
| `file_url` | String | Elérési útvonal a szerveren |
| `file_type` | String | MIME típus (pl. application/pdf) |
| `created_at` | Timestamp | Feltöltés ideje |

## 7. `comments` (Hozzászólások)
A posztok alatt folyó interakciók.
| Mező | Típus | Leírás |
| :--- | :--- | :--- |
| `id` | UUID (PK) | Egyedi azonosító |
| `post_id` | UUID (FK) | Kapcsolat a `posts` táblához |
| `author_id` | UUID (FK) | Kapcsolat a `users` táblához |
| `content` | Text | A hozzászólás szövege |
| `created_at` | Timestamp | Létrehozás ideje |

## 8. `calendar_events` (Naptár Események)
ZH-k, konzultációk vagy közös tanulások.
| Mező | Típus | Leírás |
| :--- | :--- | :--- |
| `id` | UUID (PK) | Egyedi azonosító |
| `title` | String | Az esemény megnevezése |
| `description` | Text | Részletes leírás |
| `start_time` | Timestamp | Kezdés időpontja |
| `end_time` | Timestamp | Befejezés időpontja |
| `created_by` | UUID (FK) | Kapcsolat a `users` táblához |
| `forum_id` | UUID (FK) | Fakultatív: kapcsolódó tantárgy |
| `enrollment_id` | UUID (FK) | Fakultatív: kapcsolódó szak |
| `created_at` | Timestamp | Létrehozás ideje |
