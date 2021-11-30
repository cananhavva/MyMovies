package com.mymovies.client.controller;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.Iterator;
import java.util.LinkedList;

import com.mymovies.client.model.Database;
import com.mymovies.client.model.Movie;

public class YearsMovies {
	private final String[] genres = { "ANIMATION", "CRIME", "COMEDY", "HORROR", "SCI-FI" };
	
	private LinkedList<String> moviesByYear;
	
	public YearsMovies() {
		super();
		this.moviesByYear = null;
	}
	
	public void addMovie(Movie movie) {
		this.moviesByYear.add(movie.toString());
	}
	
	public LinkedList<String> getMoviesByYear(int year) {
		if (this.moviesByYear == null) {
			this.retrieveMoviesByYear(year);
		}
		return this.moviesByYear;
	}
	
	@Override
	public String toString() {
		StringBuilder builder = new StringBuilder();
		
		for (Iterator<String> iterator = moviesByYear.iterator(); iterator.hasNext();) {
			String line = iterator.next();
			builder.append(line);
		}
		return builder.toString();
	}
	
	private void retrieveMoviesByYear(int year) {
		this.moviesByYear = new LinkedList<String>();
		String query = "SELECT g.genre, m.name from movies m, genres g, movie_genres mg where "
				+ "			m.year=? AND mg.movie_id=m.id AND " + "			mg.genre_id=g.id AND "
				+ "			g.genre = ? " + "			GROUP BY g.genre, m.name";
		
		try (Connection conn = Database.getInstance().getConnection();
				PreparedStatement stmt = conn.prepareStatement(query);) {
			
			for (String genre : genres) {
				stmt.setInt(1, year);
				stmt.setString(2, genre);
				int cnt = 0;
				ResultSet rs = stmt.executeQuery();
				while (rs.next() && cnt <= 10) {
					if (cnt == 0) {
						this.moviesByYear.add("\n" + rs.getString(1) + "\n=================\n");
						cnt++;
					} else {
						this.moviesByYear.add(String.format("%02d - %s\n", cnt++, rs.getString(2)));
					}
				}
			}
		} catch (SQLException ex) {
			ex.printStackTrace();
		}
	}
}
