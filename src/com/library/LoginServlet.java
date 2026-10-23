package com.library;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;
import java.io.IOException;
import java.io.PrintWriter;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;

public class LoginServlet extends HttpServlet {
    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        PrintWriter out = response.getWriter();

        String rollNumber = request.getParameter("rollNumber");
        String password = request.getParameter("password");

        if (rollNumber == null || password == null || rollNumber.trim().isEmpty() || password.trim().isEmpty()) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            out.write("{\"success\":false,\"message\":\"Roll number and password are required.\"}");
            return;
        }

        String hashedPassword = PasswordUtil.hash(password);

        try (Connection conn = DBUtil.getConnection()) {
            String sql = "SELECT id, full_name, roll_number, email FROM users WHERE roll_number = ? AND password_hash = ?";
            try (PreparedStatement stmt = conn.prepareStatement(sql)) {
                stmt.setString(1, rollNumber.trim());
                stmt.setString(2, hashedPassword);

                try (ResultSet rs = stmt.executeQuery()) {
                    if (rs.next()) {
                        HttpSession session = request.getSession(true);
                        session.setAttribute("userId", rs.getInt("id"));
                        session.setAttribute("fullName", rs.getString("full_name"));
                        session.setAttribute("rollNumber", rs.getString("roll_number"));
                        session.setAttribute("email", rs.getString("email"));

                        out.write("{\"success\":true,\"message\":\"Login successful.\"}");
                        return;
                    }
                }
            }

            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            out.write("{\"success\":false,\"message\":\"Invalid roll number or password.\"}");
        } catch (Exception e) {
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            out.write("{\"success\":false,\"message\":\"Database error during login.\"}");
            e.printStackTrace();
        }
    }
}
