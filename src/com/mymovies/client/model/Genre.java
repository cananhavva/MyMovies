package com.mymovies.client.model;

public class Genre {
	private static long lastId = 1;;
	private long        id;
	private String      name;

	public Genre(String name) {
		this.name = name;
		this.id   = lastId++;
	}

	@Override
	public String toString() {
		return "MovieType [id=" + this.id + ", name=" + this.name + "]";
	}

	public long getId() {
		return this.id;
	}

	public String getName() {
		return this.name;
	}
}
