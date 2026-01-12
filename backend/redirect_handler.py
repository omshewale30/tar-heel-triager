#This file handles the redirecting of emails to the appropriate department
#We can handle the forward of the email



redirect_email_address_dict = {
    "Library": "library@unc.edu",
    "Parking & Transportation": "parking@unc.edu",
    "Housing": "housing@unc.edu",
    "Registrar": "registrar@unc.edu",
    "OSSA": "ossa@unc.edu",

}



class RedirectHandler:
    def __init__(self):
        self.redirect_email_address_dict = redirect_email_address_dict