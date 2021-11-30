package com.mymovies.utils;

import java.io.FileInputStream;
import java.io.IOException;
import java.util.Properties;
import java.util.logging.Level;

public class Props {
	private static Props instance;
	private Properties props;
	private String propsFilePath;
	
	private Props () {
		super();
	}
	
	public static Props getInstance() {
		if (Props.instance == null) {
			Props.instance = new Props();
		}
		return Props.instance;
	}
	
	public void setPropsFilePath (String path, String propsFileName) {
		path = path.replaceAll("%20", " ");
		this.propsFilePath = path + "\\" + propsFileName;
	}
	
	private Properties getProperties() {
		if (this.props == null) {
			this.props = new Properties();
			try {
				this.props.load(new FileInputStream(propsFilePath));
			}
			catch (IOException ex) {
				System.err.println("Properties file not found");
				System.exit(-10);
			}
		}
		return this.props;
	}
	
	public String getProperty(String key) {
		return (String)this.getProperties().get(key);
	}
	
	public String getNamesDataFile() {
		return this.getProperties().getProperty("NAMES_DATA_FILE");
	}

	public String getMoviesDataFile() {
		return this.getProperties().getProperty("MOVIES_DATA_FILE");
	}

	public Level getLogLevel() {
		return Level.parse(Props.getInstance().getProperties().getProperty("LOG_LEVEL"));
	}

	public String getNamesTSVFile() {
		return this.getProperties().getProperty("NAMES_TSV_FILE");
	}
	
	public String getMoviesTSVFile() {
		return this.getProperties().getProperty("MOVIES_TSV_FILE");
	}

	public int getServerPort() {
		String port = this.getProperties().getProperty("SERVER_PORT");
		return Integer.parseInt(port);
	}
	
}
