ALTER TABLE "employees" ADD COLUMN "first_name" varchar(255) NOT NULL DEFAULT '';--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "last_name" varchar(255) NOT NULL DEFAULT '';--> statement-breakpoint
UPDATE "employees" SET
  "first_name" = split_part(trim("name"), ' ', 1),
  "last_name" = CASE
    WHEN position(' ' in trim("name")) > 0
    THEN trim(substring(trim("name") from position(' ' in trim("name")) + 1))
    ELSE ''
  END;--> statement-breakpoint
ALTER TABLE "employees" DROP COLUMN "name";
