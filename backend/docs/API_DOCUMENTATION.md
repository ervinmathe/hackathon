# API & CMS Dokumentáció - Hackathon Backend (v3.0)

Ez a dokumentáció tartalmazza a `thanatos` Vue frontend számára készült publikus API, valamint az adminisztratív CMS végpontjait.

---

## 1. Publikus API (`http://localhost:3000` vagy Tunnel URL)
**Swagger felület:** `http://localhost:3000/docs`

### Hitelesítés és Regisztráció (`/auth`)
*   `GET /auth/universities`: Összes választható egyetem listázása.
*   `GET /auth/universities/:id/enrollments`: Egy adott egyetemhez tartozó szakok listázása.
*   `POST /auth/register`: Új felhasználó regisztrálása.
*   `POST /auth/login`: Felhasználó bejelentkezés.
*   `POST /auth/profile/:id`: Felhasználói adatok módosítása (username, email, password, enrollment_id, year).

### Naptár (`/calendar`) - *ÚJ*
*   `GET /calendar`: Az események (ZH, konzultáció) lekérése.
    *   **Szűrés:** `?universityId=UUID&enrollmentId=UUID`. Ha csak egyetem van megadva, az összes szak eseményét listázza.

### Fórumok és Tantárgyak (`/forums`)
*   `GET /forums`: Lekéri a tantárgyakat (fórumokat). Szűrhető és kereshető (`?search=...`).
*   `GET /forums/:id/posts`: Lekéri az adott tantárgyhoz tartozó összes posztot (rövidített lista).

### Posztok és Jegyzetek (`/posts`)
*   `GET /posts/:id`: **ÚJ!** Egy konkrét poszt részletes megtekintése (tartalom, csatolmányok és az összes hozzászólás egyben).
*   `POST /posts`: Új bejegyzés létrehozása (Multipart/form-data).
*   `PATCH /posts/:id`: **ÚJ!** Saját poszt szerkesztése.
*   `DELETE /posts/:id`: **ÚJ!** Saját poszt törlése.
*   `DELETE /posts/attachments/:attachmentId`: **ÚJ!** Egy konkrét melléklet törlése a posztból.

### Hozzászólások (`/comments`)
*   `GET /comments/post/:postId`: Lekéri egy poszt hozzászólásait.
*   `POST /comments`: Új hozzászólás fűzése.
*   `PATCH /comments/:id`: **ÚJ!** Saját hozzászólás szerkesztése.
*   `DELETE /comments/:id`: **ÚJ!** Saját hozzászólás törlése.

---

## 2. Admin API - CMS Felület (`http://localhost:3001`)
**Login:** `admin` / `secret`
**Swagger felület:** `http://localhost:3001/docs`

### Moderációs funkciók
Az adminisztrátorok a `/admin` prefixszel érhetik el a következőket:
*   `GET /admin/posts`: Összes poszt listázása moderáláshoz.
*   `DELETE /admin/posts/:id`: Bármely poszt törlése.
*   `GET /admin/comments`: **ÚJ!** Összes hozzászólás listázása.
*   `DELETE /admin/comments/:id`: **ÚJ!** Bármely hozzászólás törlése.

---

## Fájlok elérése
A feltöltött fájlok publikusan elérhetőek:
`http://localhost:3000/public/uploads/UNIQUE_FILE_NAME.ext`
