package com.library;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;
import java.io.IOException;
import java.io.PrintWriter;

public class SessionServlet extends HttpServlet {
    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        PrintWriter out = response.getWriter();

        HttpSession session = request.getSession(false);
        if (session == null || session.getAttribute("userId") == null) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            out.write("{\"loggedIn\":false}\");
            return;
        }

        out.write("{\"loggedIn\":true,\"user\":{\"fullName\":\"" + session.getAttribute("fullName") + "\",\"rollNumber\":\"" + session.getAttribute("rollNumber") + "\",\"email\":\"" + session.getAttribute("email") + "\"}}\n");
    }
}
