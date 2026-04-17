# API & CMS Dokumentáció - Hackathon Backend (v2)

Ez a dokumentáció tartalmazza a `thanatos` Vue frontend számára készült publikus API, valamint az adminisztratív CMS végpontjait. Az új verzió tartalmazza az **Egyetemek (Universities)** kezelését is.

---

## 1. Publikus API (`http://localhost:3000` vagy Tunnel URL)
**Swagger felület:** `http://localhost:3000/docs`

### Hitelesítés és Regisztráció (`/auth`)
*   `GET /auth/universities`: Összes választható egyetem listázása.
*   `GET /auth/universities/:id/enrollments`: Egy adott egyetemhez tartozó szakok listázása.
*   `POST /auth/register`: Új felhasználó regisztrálása (`username`, `email`, `password`, `university_id`, `enrollment_id`, `year`).
*   `POST /auth/login`: Felhasználó bejelentkezés. Visszaadja a felhasználó adatait (id, role, university_id, enrollment_id).

### Fórumok és Tantárgyak (`/forums`)
*   `GET /forums`: Lekéri a tantárgyakat (fórumokat). Szűrhető: `?universityId=UUID&enrollmentId=UUID`.
*   `GET /forums/:id/posts`: Lekéri az adott tantárgyhoz tartozó összes posztot és fájljaikat.

### Posztok és Jegyzetek (`/posts`)
*   `POST /posts`: Új bejegyzés létrehozása. **Multipart/form-data** kérést igényel!
    *   Mezők: `forum_id`, `author_id`, `title`, `content`, `attachments` (fájlok).

---

## 2. Admin API - CMS Felület (`http://localhost:3001`)
**Webes felület:** `http://localhost:3001/login`
**Login:** `admin` / `secret` (alapértelmezett seed adat)
**Swagger felület:** `http://localhost:3001/docs`

Az admin felületen keresztül (`/admin` prefixszel) kezelhető a rendszer teljes tartalma (Full CRUD).

### CMS Webes Dashboard
A `http://localhost:3001/login` oldalon belépve egy grafikus felületen tudod:
*   Hozzáadni és törölni az egyetemeket és szakokat.
*   Létrehozni tantárgyakat (fórumokat).
*   Áttekinteni a regisztrált felhasználókat és moderálni a posztokat.

### Egyetemek kezelése (`/admin/universities`) - *Csak ADMIN*
*   `GET /admin/universities`: Összes egyetem listázása.
*   `POST /admin/universities`: Új egyetem hozzáadása.
*   `DELETE /admin/universities/:id`: Egyetem törlése.

### Szakok kezelése (`/admin/enrollments`) - *Csak ADMIN*
*   `GET /admin/enrollments`: Összes szak listázása (egyetem névvel bővítve).
*   `POST /admin/enrollments`: Új szak felvétele (szükséges a `university_id`).
*   `PATCH /admin/enrollments/:id`: Szak adatainak módosítása.
*   `DELETE /admin/enrollments/:id`: Szak törlése.

### Tantárgyak / Fórumok kezelése (`/admin/forums`) - *ADMIN és LESSADMIN*
*   `GET /admin/forums`: Összes tantárgy listázása (egyetem és szak névvel bővítve).
*   `POST /admin/forums`: Új tantárgy hozzáadása (szükséges a `university_id` és `enrollment_id`).
*   `PATCH /admin/forums/:id`: Tantárgy módosítása.
*   `DELETE /admin/forums/:id`: Tantárgy törlése.

### Szerepkörök és Jogosultságok
*   **ADMIN:** Teljes hozzáférés mindenhez (Egyetemek, Szakok, Felhasználók, Fórumok, Posztok).
*   **LESSADMIN (Mini-Admin):** Csak a tantárgyakat (fórumokat) tudja kezelni és a posztokat moderálni. Nem fér hozzá a szakokhoz és felhasználókhoz.
*   **USER:** Publikus API-n keresztül tud bejelentkezni, fórumokat böngészni és saját posztokat létrehozni. Fórumot nem hozhat létre.

### Felhasználók kezelése (`/admin/users`) - *Csak ADMIN*
*   `GET /admin/users`: Regisztrált felhasználók listázása (egyetem/szak névvel).
*   `POST /admin/users`: Új adminisztrátor vagy hallgató létrehozása.
*   `DELETE /admin/users/:id`: Felhasználó törlése.

---

## Fájlok elérése
A feltöltött fájlok publikusan elérhetőek:
`http://localhost:3000/public/uploads/UNIQUE_FILE_NAME.ext`
