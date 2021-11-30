package com.bilgeadam.mmdb.server;

import com.bilgeadam.mmdb.server.common.CommonData;

public class MyMovieServer {
	public static void main(String[] args) {
		
		CommonData.getInstance().loadPropertiesFile(args);
		
		(new MyMovieServer()).start();
	}
	
	private void start() {
		CommonData.getInstance().logInfo("server starting...");
		System.out.println("Server starting ...");
		CommonData.getInstance().importData();
		
		CommonData.getInstance().logInfo("server starting...");
		
	}
}
