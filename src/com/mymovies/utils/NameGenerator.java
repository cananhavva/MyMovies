package com.mymovies.utils;

import java.util.Random;


public class NameGenerator {

	public static String random(int len) {
		String        chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%&";
		Random        rnd   = new Random();
		StringBuilder sb    = new StringBuilder(len);
		for (int i = 0; i < len; i++)
			sb.append(chars.charAt(rnd.nextInt(chars.length())));
		return sb.toString();
	}

	public static void main(String[] args) {
		System.out.println(random(5));
		System.out.println(random(7));
		System.out.println(random(3));
		System.out.println(random(4));
		System.out.println(random(6));
	}
}
