import { MigrationInterface, QueryRunner, TableColumn, Table } from "typeorm";

export class AddDailyEmailSystem1735645396000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add columns to users table
        await queryRunner.addColumns("users", [
            new TableColumn({
                name: "timezone",
                type: "varchar",
                length: "50",
                default: "'UTC'"
            }),
            new TableColumn({
                name: "email_notifications_enabled",
                type: "boolean",
                default: true
            })
        ]);

        // Create notification_logs table
        await queryRunner.createTable(new Table({
            name: "notification_logs",
            columns: [
                {
                    name: "id",
                    type: "int",
                    isPrimary: true,
                    isGenerated: true,
                    generationStrategy: "increment"
                },
                {
                    name: "user_id",
                    type: "int"
                },
                {
                    name: "type",
                    type: "varchar",
                    length: "50"
                },
                {
                    name: "status",
                    type: "varchar",
                    length: "20"
                },
                {
                    name: "error",
                    type: "text",
                    isNullable: true
                },
                {
                    name: "sent_at",
                    type: "timestamp",
                    isNullable: true
                },
                {
                    name: "created_at",
                    type: "timestamp",
                    default: "now()"
                }
            ],
            foreignKeys: [
                {
                    columnNames: ["user_id"],
                    referencedTableName: "users",
                    referencedColumnNames: ["id"],
                    onDelete: "CASCADE"
                }
            ]
        }), true);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable("notification_logs");
        await queryRunner.dropColumn("users", "email_notifications_enabled");
        await queryRunner.dropColumn("users", "timezone");
    }

}
