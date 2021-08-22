use rusqlite::{params, Connection, Result};

#[derive(Debug)]
struct Person {
    id: i32,
    name: String,
    data: Option<Vec<u8>>,
}

struct LogDB {
    name: String,
    path: String,
    conn: Option<Connection>,
}

impl LogDB {
    fn create(& mut self, path: String) -> Result<()> {
        self.conn = Connection::open(path)?;

        self.conn.execute(
            "CREATE TABLE logs (
                entry TEXT,
            )",
            [],
        )?;

        Ok(())
    }

    fn batch_insert_lines(&self, lines: Vec<String>) -> Result<()> {
    }
}

fn create_connection() -> Result<()> {

    let me = Person {
        id: 0,
        name: "Steven".to_string(),
        data: None,
    };
    conn.execute(
        "INSERT INTO person (name, data) VALUES (?1, ?2)",
        params![me.name, me.data],
    )?;

    let mut stmt = conn.prepare("SELECT id, name, data FROM person")?;
    let person_iter = stmt.query_map([], |row| {
        Ok(Person {
            id: row.get(0)?,
            name: row.get(1)?,
            data: row.get(2)?,
        })
    })?;

    for person in person_iter {
        println!("Found person {:?}", person.unwrap());
    }
    Ok(())
}

