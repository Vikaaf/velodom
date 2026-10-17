CREATE TABLE IF NOT EXISTS bikes (
                                     id            INTEGER PRIMARY KEY,
                                     sku           TEXT NOT NULL UNIQUE,
                                     name          TEXT NOT NULL,
                                     brand         TEXT NOT NULL,
                                     type          TEXT NOT NULL CHECK (type IN ('city','mountain','road','kids','hybrid')),
                                     description   TEXT,
                                     price         INTEGER NOT NULL,
                                     old_price     INTEGER,
                                     wheel_size    REAL,
                                     speeds        INTEGER,
                                     gender        TEXT NOT NULL DEFAULT 'unisex',
                                     age_group     TEXT NOT NULL DEFAULT 'adult',
                                     model_year    INTEGER,
                                     weight        REAL,
                                     rating        REAL DEFAULT 0,
                                     reviews_count INTEGER DEFAULT 0,
                                     badge         TEXT,
                                     popularity    INTEGER DEFAULT 0,
                                     created_at    TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bike_sizes (
                                          id         INTEGER PRIMARY KEY,
                                          bike_id    INTEGER NOT NULL REFERENCES bikes(id) ON DELETE CASCADE,
                                          frame_size TEXT NOT NULL,
                                          min_height INTEGER,
                                          max_height INTEGER,
                                          in_stock   INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS bike_colors (
                                           id          INTEGER PRIMARY KEY,
                                           bike_id     INTEGER NOT NULL REFERENCES bikes(id) ON DELETE CASCADE,
                                           name        TEXT NOT NULL,
                                           color_group TEXT NOT NULL,
                                           hex         TEXT
);

CREATE TABLE IF NOT EXISTS bike_images (
                                           id         INTEGER PRIMARY KEY,
                                           bike_id    INTEGER NOT NULL REFERENCES bikes(id) ON DELETE CASCADE,
                                           url        TEXT NOT NULL,
                                           sort_order INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS bike_specs (
                                          id         INTEGER PRIMARY KEY,
                                          bike_id    INTEGER NOT NULL REFERENCES bikes(id) ON DELETE CASCADE,
                                          group_name TEXT NOT NULL,
                                          name       TEXT NOT NULL,
                                          value      TEXT NOT NULL,
                                          sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS reviews (
                                       id            INTEGER PRIMARY KEY,
                                       bike_id       INTEGER NOT NULL REFERENCES bikes(id) ON DELETE CASCADE,
                                       author        TEXT NOT NULL,
                                       rating        INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
                                       frame_size    TEXT,
                                       usage_period  TEXT,
                                       text          TEXT NOT NULL,
                                       helpful_count INTEGER NOT NULL DEFAULT 0,
                                       created_at    TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
                                      id              INTEGER PRIMARY KEY,
                                      customer_name   TEXT NOT NULL,
                                      phone           TEXT NOT NULL,
                                      email           TEXT,
                                      delivery_method TEXT NOT NULL CHECK (delivery_method IN ('courier','pickup','russia')),
                                      address         TEXT,
                                      payment_method  TEXT NOT NULL,
                                      total           INTEGER NOT NULL,
                                      status          TEXT NOT NULL DEFAULT 'new',
                                      created_at      TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS order_items (
                                           id         INTEGER PRIMARY KEY,
                                           order_id   INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
                                           bike_id    INTEGER NOT NULL REFERENCES bikes(id),
                                           frame_size TEXT,
                                           color      TEXT,
                                           quantity   INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
                                           price      INTEGER NOT NULL
);