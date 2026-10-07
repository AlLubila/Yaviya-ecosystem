CREATE TABLE product_view_events (
  country TEXT NOT NULL,
  product_id INTEGER NOT NULL,
  visitor_hash TEXT NOT NULL,
  bucket INTEGER NOT NULL,
  viewed_at INTEGER NOT NULL,
  PRIMARY KEY (country, product_id, visitor_hash, bucket)
);
--> statement-breakpoint
CREATE INDEX product_view_period_idx ON product_view_events(country, product_id, viewed_at);
