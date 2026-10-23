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

public class SignupServlet extends HttpServlet {
    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        PrintWriter out = response.getWriter();

        String fullName = request.getParameter("fullName");
        String rollNumber = request.getParameter("rollNumber");
        String email = request.getParameter("email");
        String password = request.getParameter("password");

        if (fullName == null || rollNumber == null || email == null || password == null ||
                fullName.trim().isEmpty() || rollNumber.trim().isEmpty() || email.trim().isEmpty() || password.trim().isEmpty()) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            out.write("{\"success\":false,\"message\":\"All fields are required.\"}");
            return;
        }

        String passwordHash = PasswordUtil.hash(password);

        try (Connection conn = DBUtil.getConnection()) {
            String checkSql = "SELECT id FROM users WHERE roll_number = ? OR email = ?";
            try (PreparedStatement checkStmt = conn.prepareStatement(checkSql)) {
                checkStmt.setString(1, rollNumber.trim());
                checkStmt.setString(2, email.trim());

                try (ResultSet rs = checkStmt.executeQuery()) {
                    if (rs.next()) {
                        response.setStatus(HttpServletResponse.SC_CONFLICT);
                        out.write("{\"success\":false,\"message\":\"A user with this roll number or email already exists.\"}");
                        return;
                    }
                }
            }

            String insertSql = "INSERT INTO users (full_name, roll_number, email, password_hash, created_at) VALUES (?, ?, ?, ?, NOW())";
            try (PreparedStatement insertStmt = conn.prepareStatement(insertSql)) {
                insertStmt.setString(1, fullName.trim());
                insertStmt.setString(2, rollNumber.trim());
                insertStmt.setString(3, email.trim());
                insertStmt.setString(4, passwordHash);
                insertStmt.executeUpdate();
            }

            out.write("{\"success\":true,\"message\":\"Account created successfully.\"}");
        } catch (Exception e) {
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            out.write("{\"success\":false,\"message\":\"Database error while creating account.\"}");
            e.printStackTrace();
        }
    }
}
