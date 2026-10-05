package com.project.webbasedtourismandtravelmanagementsystem.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;
import java.util.List;
import java.util.Map;

/**
 * Hibernate creates MySQL ENUM columns for every {@code @Enumerated(EnumType.STRING)} field, and
 * {@code ddl-auto=update} never changes them afterwards. Adding a new value to a Java enum (a role,
 * a booking status, a payment method...) then fails with "Data truncated for column".
 * This runner converts every ENUM column in the current schema to VARCHAR(40) so new values can be saved.
 * Runs before the demo data seeder and does nothing on an up-to-date database.
 */
@Component
@Order(0)
public class RoleColumnMigration implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(RoleColumnMigration.class);

    private final JdbcTemplate jdbc;
    private final DataSource dataSource;

    public RoleColumnMigration(JdbcTemplate jdbc, DataSource dataSource) {
        this.jdbc = jdbc;
        this.dataSource = dataSource;
    }

    @Override
    public void run(ApplicationArguments args) throws Exception {
        String product;
        try (Connection c = dataSource.getConnection()) {
            product = c.getMetaData().getDatabaseProductName();
        }
        if (!"MySQL".equalsIgnoreCase(product)) {
            return;
        }
        List<Map<String, Object>> columns = jdbc.queryForList(
                "SELECT TABLE_NAME, COLUMN_NAME, IS_NULLABLE FROM information_schema.COLUMNS "
                        + "WHERE TABLE_SCHEMA = DATABASE() AND DATA_TYPE = 'enum'");
        for (Map<String, Object> col : columns) {
            String table = String.valueOf(col.get("TABLE_NAME"));
            String column = String.valueOf(col.get("COLUMN_NAME"));
            boolean nullable = "YES".equalsIgnoreCase(String.valueOf(col.get("IS_NULLABLE")));
            if (!table.matches("[A-Za-z0-9_]+") || !column.matches("[A-Za-z0-9_]+")) {
                continue;
            }
            try {
                jdbc.execute("ALTER TABLE `" + table + "` MODIFY `" + column + "` VARCHAR(40) "
                        + (nullable ? "NULL" : "NOT NULL"));
                log.info("Converted {}.{} from ENUM to VARCHAR(40)", table, column);
            } catch (Exception e) {
                log.warn("Could not convert {}.{} from ENUM to VARCHAR: {}", table, column, e.getMessage());
            }
        }
    }
}
