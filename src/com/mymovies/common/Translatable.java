package com.mymovies.common;

public interface Translatable {
	
	String getI18NKey();
	
	default String getI18NKeyIdentifier() {
		return this.getClass().getSimpleName().toUpperCase() + ".";
	}
}
