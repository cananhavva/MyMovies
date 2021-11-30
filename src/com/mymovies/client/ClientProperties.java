package com.mymovies.client;

import com.mymovies.utils.Props;

public class ClientProperties {
	private static ClientProperties instance;
	private Props props;
	
	private ClientProperties() {
		this.props = Props.getInstance();
		props.setPropsFilePath(
				"C:\\Users\\babur.somer\\baboost-java\\MyMovies\\src\\com\\bilgeadam\\boost\\course01\\mymovies\\client",
				"client.properties");
	}
	
	public static ClientProperties getInstance() {
		if (ClientProperties.instance == null) {
			ClientProperties.instance = new ClientProperties();
		}
		return ClientProperties.instance;
	}
	
	public String getDBName() {
		return props.getProperty("DB_NAME");
	}
	
	public String getMoviesCSV() {
		return props.getProperty("MOVIES_FILE");
	}
	
	public String getLinksCSV() {
		return props.getProperty("LINKS_FILE");
	}
	
	public String getRatingsCSV() {
		return props.getProperty("RATINGS_FILE");
	}
	
	public String getTagsCSV() {
		return props.getProperty("TAGS_FILE");
	}
	
	public String getDbURL() {
		// ?user=boost&password=boost"
		return props.getProperty("CONNECTOR_TYPE") + ":" + props.getProperty("DB_VENDOR") + "://"
				+ props.getProperty("DB_SERVER") + ":" + props.getProperty("DB_PORT") + "/"
				+ props.getProperty("DB_NAME") + "?user=" + props.getProperty("DB_USER") + "&password="
				+ props.getProperty("DB_PASS");
	}
	
}
