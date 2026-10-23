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

public class BorrowServlet extends HttpServlet {
    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        PrintWriter out = response.getWriter();

        HttpSession session = request.getSession(false);
        if (session == null || session.getAttribute("userId") == null) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            out.write("{\"success\":false,\"message\":\"Please log in first.\"}");
            return;
        }

        String bookIdParam = request.getParameter("bookId");
        if (bookIdParam == null || bookIdParam.trim().isEmpty()) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            out.write("{\"success\":false,\"message\":\"Book ID is required.\"}");
            return;
        }

        int bookId = Integer.parseInt(bookIdParam);
        int userId = (Integer) session.getAttribute("userId");

        try (Connection conn = DBUtil.getConnection()) {
            conn.setAutoCommit(false);

            String stockSql = "SELECT available_copies FROM books WHERE id = ? FOR UPDATE";
            try (PreparedStatement stockStmt = conn.prepareStatement(stockSql)) {
                stockStmt.setInt(1, bookId);
                try (ResultSet rs = stockStmt.executeQuery()) {
                    if (!rs.next()) {
                        conn.rollback();
                        response.setStatus(HttpServletResponse.SC_NOT_FOUND);
                        out.write("{\"success\":false,\"message\":\"Book not found.\"}");
                        return;
                    }

                    int availableCopies = rs.getInt("available_copies");
                    if (availableCopies <= 0) {
                        conn.rollback();
                        response.setStatus(HttpServletResponse.SC_CONFLICT);
                        out.write("{\"success\":false,\"message\":\"This book is currently unavailable.\"}");
                        return;
                    }

                    String updateSql = "UPDATE books SET available_copies = available_copies - 1 WHERE id = ?";
                    try (PreparedStatement updateStmt = conn.prepareStatement(updateSql)) {
                        updateStmt.setInt(1, bookId);
                        updateStmt.executeUpdate();
                    }

                    String borrowSql = "INSERT INTO borrow_records (user_id, book_id, borrowed_at, due_date) VALUES (?, ?, NOW(), DATE_ADD(NOW(), INTERVAL 14 DAY))";
                    try (PreparedStatement borrowStmt = conn.prepareStatement(borrowSql)) {
                        borrowStmt.setInt(1, userId);
                        borrowStmt.setInt(2, bookId);
                        borrowStmt.executeUpdate();
                    }
                }
            }

            conn.commit();
            out.write("{\"success\":true,\"message\":\"Book borrowed successfully.\"}");
        } catch (Exception e) {
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            out.write("{\"success\":false,\"message\":\"Unable to borrow book right now.\"}");
            e.printStackTrace();
        }
    }
}
