package com.bilgeadam.mmdb.server.common;

import java.util.logging.Level;
import java.util.logging.Logger;

import com.bilgeadam.mmdb.server.data.Name;
import com.bilgeadam.mmdb.util.Props;

public class CommonData {
	private static CommonData instance;
	private int port;
	private Object logger;
	
	private CommonData() {
		this.setPort(Integer.MAX_VALUE);
		
	}
	
	public static CommonData getInstance() {
		if (instance == null) {
			instance = new CommonData();
			
		}
		return instance;
	}
	
	public void loadPropertiesFile(String[] args) {
		if (args.length < 1) {
			// programın çalıştığı lokasyonu bulmak için kullanılır.
			// her program muhakkak bir Thread içinde çalışır.
			// thread in meta-bilgileri üzerinden nerede çalıştığını sorgulayabilirsiniz.
			// sonuçta ilk arguman olarak server properties in path bilgisi ikinci olarakta
			// server properties bilgilerini verir
			Props.getInstance().setPropsFilePath(
					Thread.currentThread().getContextClassLoader().getResource("").getPath(), "server properties");
			System.out.println("No properties-File defined. Using Default");
		} else {
			Props.getInstance().setPropsFilePath(args[0], "server.properties");
			System.out.println("Using given properties-File on <<<" + args[0] + ">>>");
		}
	}
	
	public void logInfo(String msg) {
		((Logger) this.getLogger()).info(msg);
		
	}
	
	private Object getLogger() {
		if (this.logger == null) {
			this.logger = Logger.getLogger("My Movie Server Logger");
			((Logger) this.getLogger())
					.setLevel(Level.parse(Props.getInstance().getProperties().getProperty("LOG_LEVEL")));
		}
		return null;
	}
	
	public void importData() {
		((Logger) CommonData.getInstance().getLogger()).info("Enter import Data");
		if (this.nameDataExisting()) {
			this.deserializeNames();
		} else {
			this.readNames();
		}
		if (this.movieDataExisting()) {
			this.deserializeMovies();
		} else {
			this.readMovies();
		}
		
	}
	
	private void readMovies() {
		// TODO Auto-generated method stub
		
	}
	
	private void deserializeMovies() {
		// TODO Auto-generated method stub
		
	}
	
	private boolean movieDataExisting() {
		// TODO Auto-generated method stub
		return false;
	}
	
	private void readNames() {
		// TODO Auto-generated method stub
		
	}
	
	private void deserializeNames() {
		// TODO Auto-generated method stub
		
	}
	
	private boolean nameDataExisting() {
		// TODO Auto-generated method stub
		return false;
	}
	
	public void addName(Name name) {
		// TODO Auto-generated method stub
		
	}
	
	public void logError(String message) {
		// TODO Auto-generated method stub
		
	}

	public int getPort() {
		return port;
	}

	public void setPort(int port) {
		this.port = port;
	}
	
}
