package com.bilgeadam.mmdb.util;

import java.io.FileInputStream;
import java.io.IOException;
import java.util.Properties;

public class Props {
	private static Props instance;
	private Properties props;
	private String propsFilePath;
	
	private Props() {
		super();
	}
	
	public static Props getInstance() {
		if (Props.instance == null) {
			Props.instance = new Props();
		}
		return Props.instance;
	}
	
	public void setPropsFilePath(String path, String propsFileName) {
		path = path.replaceAll("%20", " ");
		this.propsFilePath = path + "\\" + propsFileName;
	}
	
	public Properties getProperties() {
		if (this.props == null) {
			this.props = new Properties();
			try {
				this.props.load(new FileInputStream(propsFilePath));
			} catch (IOException ex) {
				System.err.println("Properties file not found");
				System.exit(-10);
			}
		}
		return this.props;
	}
	
	public String getNamesTSVFile() {
		// TODO Auto-generated method stub
		return null;
	}
}
