# API & CMS Dokumentáció - Hackathon Backend

Ez a dokumentáció tartalmazza a `thanatos` Vue frontend számára készült publikus API, valamint az adminisztratív CMS végpontjait.

---

## 1. Publikus API (`http://localhost:3000` vagy Tunnel URL)
**Swagger felület:** `http://localhost:3000/docs`

### Hitelesítés és Regisztráció (`/auth`)
*   `GET /auth/enrollments`: Lekéri az összes választható szakot (Select listához).
*   `POST /auth/register`: Új felhasználó regisztrálása (`username`, `email`, `password`, `enrollment_id`, `year`).

### Fórumok és Tantárgyak (`/forums`)
*   `GET /forums`: Lekéri az összes tantárgyat (fórumot). Opcionális szűrés: `?enrollmentId=UUID`.
*   `GET /forums/:id/posts`: Lekéri az adott tantárgyhoz tartozó összes posztot és fájljaikat.

### Posztok és Jegyzetek (`/posts`)
*   `POST /posts`: Új bejegyzés létrehozása. **Multipart/form-data** kérést igényel!
    *   Mezők: `forum_id`, `author_id`, `title`, `content`, `attachments` (fájlok).

---

## 2. Admin API - CMS Felület (`http://localhost:3001`)
**Webes felület:** `http://localhost:3001/login`
**Login:** `admin` / `admin`
**Swagger felület:** `http://localhost:3001/docs`

Az admin felületen keresztül (`/admin` prefixszel) kezelhető a rendszer teljes tartalma (Full CRUD).

### CMS Webes Dashboard
A `http://localhost:3001/login` oldalon belépve egy grafikus felületen tudod:
*   Hozzáadni és törölni a szakokat.
*   Létrehozni tantárgyakat (fórumokat) a szakokhoz.
*   Áttekinteni a regisztrált felhasználókat és moderálni a posztokat.

### Szakok kezelése (`/admin/enrollments`)
*   `GET /admin/enrollments`: Összes szak listázása.
*   `POST /admin/enrollments`: Új szak felvétele.
*   `PATCH /admin/enrollments/:id`: Szak adatainak módosítása.
*   `DELETE /admin/enrollments/:id`: Szak törlése.

### Tantárgyak / Fórumok kezelése (`/admin/forums`)
*   `GET /admin/forums`: Összes tantárgy listázása.
*   `POST /admin/forums`: Új tantárgy hozzáadása szakhoz.
*   `PATCH /admin/forums/:id`: Tantárgy módosítása.
*   `DELETE /admin/forums/:id`: Tantárgy törlése.

### Felhasználók kezelése (`/admin/users`)
*   `GET /admin/users`: Regisztrált felhasználók listázása (jelszó nélkül).
*   `DELETE /admin/users/:id`: Felhasználó törlése.

### Tartalom moderáció (`/admin/posts`)
*   `GET /admin/posts`: Összes beküldött poszt listázása.
*   `DELETE /admin/posts/:id`: Megfelelőtlen poszt törlése.

---

## Fájlok elérése
A feltöltött fájlok publikusan elérhetőek:
`http://localhost:3000/public/uploads/UNIQUE_FILE_NAME.ext`
