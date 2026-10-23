package com.library;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.PrintWriter;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;

public class BooksServlet extends HttpServlet {
    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        PrintWriter out = response.getWriter();

        String q = request.getParameter("q");
        StringBuilder sql = new StringBuilder("SELECT id, title, author, category, available_copies FROM books WHERE is_active = 1");
        if (q != null && !q.trim().isEmpty()) {
            sql.append(" AND (LOWER(title) LIKE ? OR LOWER(author) LIKE ? OR LOWER(category) LIKE ?)");
        }
        sql.append(" ORDER BY title ASC");

        try (Connection conn = DBUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql.toString())) {

            if (q != null && !q.trim().isEmpty()) {
                String pattern = "%" + q.toLowerCase() + "%";
                stmt.setString(1, pattern);
                stmt.setString(2, pattern);
                stmt.setString(3, pattern);
            }

            try (ResultSet rs = stmt.executeQuery()) {
                out.write("[");
                boolean first = true;

                while (rs.next()) {
                    if (!first) out.write(",");
                    first = false;

                    out.write("{\"id\":" + rs.getInt("id") +
                            ",\"title\":\"" + escapeJson(rs.getString("title")) + "\"" +
                            ",\"author\":\"" + escapeJson(rs.getString("author")) + "\"" +
                            ",\"category\":\"" + escapeJson(rs.getString("category")) + "\"" +
                            ",\"availableCopies\":" + rs.getInt("available_copies") + "}");
                }

                out.write("]");
            }
        } catch (Exception e) {
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            out.write("[]");
            e.printStackTrace();
        }
    }

    private String escapeJson(String value) {
        if (value == null) return "";
        return value.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r");
    }
}
