package com.project.webbasedtourismandtravelmanagementsystem.Partner.DTO;


public class PartnerDTO {


    private Long partnerId;


    private String partnerName;


    private String partnerType;


    private String email;


    private String phone;


    private String address;


    private String status;



    public Long getPartnerId() {
        return partnerId;
    }


    public void setPartnerId(Long partnerId) {
        this.partnerId = partnerId;
    }



    public String getPartnerName() {
        return partnerName;
    }


    public void setPartnerName(String partnerName) {
        this.partnerName = partnerName;
    }



    public String getPartnerType() {
        return partnerType;
    }


    public void setPartnerType(String partnerType) {
        this.partnerType = partnerType;
    }



    public String getEmail() {
        return email;
    }


    public void setEmail(String email) {
        this.email = email;
    }



    public String getPhone() {
        return phone;
    }


    public void setPhone(String phone) {
        this.phone = phone;
    }



    public String getAddress() {
        return address;
    }


    public void setAddress(String address) {
        this.address = address;
    }



    public String getStatus() {
        return status;
    }


    public void setStatus(String status) {
        this.status = status;
    }

}