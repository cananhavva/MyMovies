package com.mymovies.client.model;

import java.util.Random;

import com.bilgeadam.boost.course01.mymovies.utils.NameGenerator;

public class User {
	private long   id;
	private String name;

	public User(long id) {
		this.id = id;
		Random rnd = new Random();
		this.name = NameGenerator.random(rnd.nextInt(6) + 2);
	}

	public long getId() {
		return this.id;
	}

	public String getName() {
		return this.name;
	}

	@Override
	public String toString() {
		return "User [id=" + this.id + ", name=" + this.name + "]";
	}
}
