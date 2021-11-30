package com.bilgeadam.mmdb.server.data;

import java.io.BufferedReader;
import java.io.Externalizable;
import java.io.File;
import java.io.FileReader;
import java.io.IOException;
import java.io.ObjectInput;
import java.io.ObjectOutput;
import java.util.Arrays;

import com.bilgeadam.mmdb.server.common.CommonData;
import com.bilgeadam.mmdb.util.Props;

// nconst primaryName birthYear deathYear primaryProfession knownForTitles
public class Name implements Externalizable {
	private String id;
	private String primaryName;
	private int birthYear;
	private int deathYear;
	private String[] professions;
	private String[] knownForTitles;
	
	private Name() {
		super();
	}
	
	private static Name parse(String line) {
		
		return null;
	}
	
	public static void readNames() {
		CommonData.getInstance().logInfo(("Reading names data"));
		
		File file = new File(Props.getInstance().getNamesTSVFile());
		
		int nameCnt = 0;
		try (FileReader fR = new FileReader(file); BufferedReader bR = new BufferedReader(fR);) {
			
			while (true) {
				String line;
				try {
					line = bR.readLine();
					if (line == null) {
						break;
					}
					if (line.startsWith("nconst")) {
						continue;
					}
					Name name = Name.parse(line);
					nameCnt++;
					CommonData.getInstance().addName(name);
				} catch (Error err) {
					System.out.println(nameCnt);
					err.printStackTrace();
				} catch (IOException ex) {
					System.out.println(nameCnt);
					ex.printStackTrace();
				} catch (Throwable t) {
					System.out.println(nameCnt);
					t.printStackTrace();
				}
			}
		} catch (IOException ex) {
			CommonData.getInstance().logError(ex.getMessage());
		}
		CommonData.getInstance().logInfo(nameCnt + " records read from movies data");
	}
	
	@Override
	public String toString() {
		return "Name [id=" + this.id + ", primaryName=" + this.primaryName + ", birthYear=" + this.birthYear
				+ ", deathYear=" + this.deathYear + ", professions=" + Arrays.toString(this.professions)
				+ ", knownForTitles=" + Arrays.toString(this.knownForTitles) + "]";
	}
	
	public String getId() {
		return this.id;
	}
	
	public String getPrimaryName() {
		return this.primaryName;
	}
	
	public int getBirthYear() {
		return this.birthYear;
	}
	
	public int getDeathYear() {
		return this.deathYear;
	}
	
	public String[] getProfessions() {
		return this.professions;
	}
	
	public String[] getKnownForTitles() {
		return this.knownForTitles;
	}
	
	@Override
	public void writeExternal(ObjectOutput out) throws IOException {
		
	}
	
	@Override
	public void readExternal(ObjectInput in) throws IOException, ClassNotFoundException {
		
	}
}