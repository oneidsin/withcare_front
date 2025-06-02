public class ProfileDTO {

	private String id;
	private Integer cancer_idx;
	private Integer stage_idx;
	private String profile_photo;
	private String intro;
	private boolean profile_yn;
	private int accessCnt;
	private String cancer_name;
	private String stage_name;

	private String profile_imageurl;

	private String name; // 추가
	private String year; // 추가 (정수면 int로)
	private String gender; // 추가
	private String email; // 추가

	// getter/setter 메서드들
	public String getId() {
		return id;
	}
	
	public void setId(String id) {
		this.id = id;
	}
	
	public Integer getCancer_idx() {
		return cancer_idx;
	}
	
	public void setCancer_idx(Integer cancer_idx) {
		this.cancer_idx = cancer_idx;
	}
	
	public Integer getStage_idx() {
		return stage_idx;
	}
	
	public void setStage_idx(Integer stage_idx) {
		this.stage_idx = stage_idx;
	}
	
	public String getProfile_photo() {
		return profile_photo;
	}
	
	public void setProfile_photo(String profile_photo) {
		this.profile_photo = profile_photo;
	}
	
	public String getIntro() {
		return intro;
	}
	
	public void setIntro(String intro) {
		this.intro = intro;
	}
	
	public boolean isProfile_yn() {
		return profile_yn;
	}
	
	public void setProfile_yn(boolean profile_yn) {
		this.profile_yn = profile_yn;
	}
	
	public int getAccessCnt() {
		return accessCnt;
	}
	
	public void setAccessCnt(int accessCnt) {
		this.accessCnt = accessCnt;
	}
	
	public String getCancer_name() {
		return cancer_name;
	}
	
	public void setCancer_name(String cancer_name) {
		this.cancer_name = cancer_name;
	}
	
	public String getStage_name() {
		return stage_name;
	}
	
	public void setStage_name(String stage_name) {
		this.stage_name = stage_name;
	}
	
	public String getProfile_imageurl() {
		return profile_imageurl;
	}
	
	public void setProfile_imageurl(String profile_imageurl) {
		this.profile_imageurl = profile_imageurl;
	}
	
	public String getName() {
		return name;
	}
	
	public void setName(String name) {
		this.name = name;
	}
	
	public String getYear() {
		return year;
	}
	
	public void setYear(String year) {
		this.year = year;
	}
	
	public String getGender() {
		return gender;
	}
	
	public void setGender(String gender) {
		this.gender = gender;
	}
	
	public String getEmail() {
		return email;
	}
	
	public void setEmail(String email) {
		this.email = email;
	}
} 