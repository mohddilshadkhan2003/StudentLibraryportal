# Student Library Portal

A signup/login student library portal:
- **Frontend:** plain HTML, CSS, JS
- **Backend:** Java Servlets (no framework)
- **Database:** MySQL, accessed via JDBC

It runs on your machine through **Apache Tomcat** + **MySQL**, both installed locally.

---

## 1. What you need installed

| Tool | Why | Link |
|---|---|---|
| JDK 11+ | to compile the servlets | adoptium.net |
| Apache Tomcat 9 or 10 | serves the app on localhost | tomcat.apache.org |
| MySQL 8 (or MySQL via XAMPP/WAMP) | the database | mysql.com |
| MySQL Connector/J (`mysql-connector-j-x.x.x.jar`) | the JDBC driver | dev.mysql.com/downloads/connector/j |

> If you use Tomcat 9, the servlet API is `javax.servlet.*` (what this code uses).
> If you use Tomcat 10+, it switched to `jakarta.servlet.*` — see the note at the bottom if you hit that.

---

## 2. Folder layout

```
StudentLibraryPortal/
├── login.html, signup.html, dashboard.html   ← pages
├── css/style.css
├── js/auth.js, dashboard.js
├── WEB-INF/
│   ├── web.xml
│   ├── classes/          ← compiled .class files go here (you'll create this)
│   └── lib/              ← mysql-connector-j jar goes here (you'll create this)
├── src/com/library/      ← servlet source (.java)
└── database/schema.sql   ← run this in MySQL first
```

Tomcat expects a single deployable folder with `WEB-INF/` at its root sitting
next to the HTML files — this project is already laid out that way.

---

## 3. Set up the database

1. Start MySQL.
2. Run the schema file:
   ```bash
   mysql -u root -p < database/schema.sql
   ```
   This creates the `library_portal` database, the `users`, `books`, and
   `borrow_records` tables, and a handful of sample books.

---

## 4. Point the code at your database

Open `src/com/library/DBUtil.java` and set your real MySQL username/password:

```java
private static final String DB_USER = "root";
private static final String DB_PASSWORD = "your_mysql_password";
```

---

## 5. Compile the servlets

From inside `StudentLibraryPortal/`:

```bash
mkdir -p WEB-INF/classes WEB-INF/lib
```

Download `mysql-connector-j-x.x.x.jar` and put it in `WEB-INF/lib/`.

Then compile against Tomcat's servlet API:

```bash
javac -cp "WEB-INF/lib/*:$CATALINA_HOME/lib/servlet-api.jar" \
      -d WEB-INF/classes \
      src/com/library/*.java
```

- `$CATALINA_HOME` is your Tomcat install folder.
- On Windows, replace the `:` in `-cp` with `;`.

You should end up with `.class` files under `WEB-INF/classes/com/library/`.

---

## 6. Deploy to Tomcat and run it

Copy the whole `StudentLibraryPortal` folder into Tomcat's `webapps/` directory:

```bash
cp -r StudentLibraryPortal $CATALINA_HOME/webapps/
```

Start Tomcat:

```bash
$CATALINA_HOME/bin/startup.sh      # Mac/Linux
%CATALINA_HOME%\bin\startup.bat    # Windows
```

Open your browser to:

```
http://localhost:8080/StudentLibraryPortal/login.html
```

Sign up, log in, search the catalog, and borrow a book — everything is wired
to MySQL through the servlets in `src/com/library`.

---

## How the pieces fit together

- `signup.html` / `login.html` submit to `api/signup` and `api/login`
  (`SignupServlet.java`, `LoginServlet.java`), which use `DBUtil.java` for the
  JDBC connection and `PasswordUtil.java` to hash/verify passwords (SHA-256 +
  per-user salt — never stored in plain text).
- A successful login creates an `HttpSession`. `dashboard.html` calls
  `api/session` (`SessionServlet.java`) on load to confirm you're logged in
  and redirects to `login.html` if not.
- The dashboard loads the catalog from `api/books` (`BooksServlet.java`),
  with live search via the `q` query parameter.
- Clicking **Borrow** calls `api/borrow` (`BorrowServlet.java`), which
  decrements `available_copies` and inserts a row into `borrow_records` with
  a 14-day due date, inside a transaction so two students can't take the last
  copy at once.
- `api/logout` (`LogoutServlet.java`) invalidates the session.

## If your Tomcat is version 10+ (Jakarta EE)

Tomcat 10 renamed the servlet package from `javax.servlet` to
`jakarta.servlet`. If you're on Tomcat 10+, do a find-and-replace of
`javax.servlet` → `jakarta.servlet` across all files in `src/com/library/`
before compiling.

## Extending it

Ideas if you want to take this further for a class project:
- A "My Borrowed Books" tab reading from `borrow_records` where `returned_on IS NULL`.
- A return button that sets `returned_on = CURDATE()` and increments `available_copies`.
- An admin view for librarians to add/edit books.
- Overdue fine calculation based on `due_date`.
