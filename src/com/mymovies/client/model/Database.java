package com.mymovies.client.model;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;

import com.bilgeadam.boost.course01.mymovies.client.ClientProperties;

public class Database {
	private static Database instance;
	private Connection      connection;

	private Database() {
		super();
	}

	public static Database getInstance() {
		if (Database.instance == null) {
			Database.instance = new Database();
		}
		return Database.instance;
	}

	public Connection getConnection() throws SQLException {
		if (this.connection == null || this.connection.isClosed()) {
			try {
				this.connection = DriverManager.getConnection(ClientProperties.getInstance().getDbURL());
			}
			catch (SQLException ex) {
				ex.printStackTrace();
				System.exit(-10);
			}
		}
		
		return this.connection;
	}

	public boolean isInitialized() {
		final String query = "SELECT * FROM pg_database WHERE datname=?;";
		try (Connection conn = DriverManager.getConnection("jdbc:postgresql://localhost:5432/", "postgres", "root")) {
			PreparedStatement st = conn.prepareStatement(query);
			st.setString(1, ClientProperties.getInstance().getDBName());
			ResultSet resut = st.executeQuery();
			while (resut.next()) {
				return true;
			}
		}
		catch (SQLException e) {
			System.out.println("'isThereDatabase'"
					+ /* + language.LOG_ERROR() + ": " + language.LOG_IS_NOT_SUCCESSFUL() + "\n" */ e.getMessage());
			return false;
		}
		return false;
	}

	public boolean isLoaded() {
		try (Connection conn = Database.getInstance().getConnection(); Statement stmt = conn.createStatement();) {
			ResultSet rs = stmt.executeQuery("SELECT COUNT(*) FROM movies;");
			rs.next();
			int count = rs.getInt(1);
			return count >= 2 ? true : false;
		}
		catch (Exception ex) {
			System.err.println(ex.getMessage());
		}
		return false;
	}

}
