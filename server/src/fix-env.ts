
import fs from 'fs';
import path from 'path';

const envPath = '/home/sethupathy/Downloads/JoinUP/server/.env';
const fullKey = "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDPmKhT6jzl7vHn\navEe/+GmYglEGWRykG9el5OiE8gyNLz+rZiree3dF9xZA9QH7snvhARXNbaqTV8o\ns71C3P05dD9dXP/Cor/Jdf7XzFVDKHIhfZGbpPQXOZrBwoMN3kEl1vMSwpQd0LIY\nYi3b2x+ZhRG5LQHct1SgS7a2wpO4VZPgXWrDpW00uQYhgLuUBzTLEqMihHrXAQgG\n6juM8OJivvGCBOGutjI+48ReIEMPe+0tgt+ZZBaYOKFJeA4brQwP8XpndRBMsHju\nA/qJEkhf9PCa7TqWncNZO86jcV4/odL1rpsVx0TP1ZdPYWrh2YbEvFqKJ15KHogq\nT1ZKe45VAgMBAAECggEAMZqo2BpPsGKK13Dwiid61/qze5v0qkJUdj4SVwdSjhqX\ncWRyJ0E0guC1dGirhLS8eFirf9o0GlfwDcX7CovLDyw1it3SuEOSv7UL7q0iz3AN\n6245eX8uGxGW5scPcSQjHYNR5DDt2vz33UcybYcbsx9+l2iHeiGtXTsSPvPZ/9C2\njt/W1VZWvgRsJfK4IbDogoPsO+zAeZEcJmP2yA2WsRiL3TTmAJJaPahIRzNQ2Qf1\nHuFISRz2GcgTyxF7uScFNgeAhDNfpDwvRqSJl+F/+c0yHkA7Q5U91MoLn0nSwlFT\nm+Bct6IvARn6yJqgXdXsryhxdPaFnqR/GVZ3IxvocQKBgQD4tgvXzdVgI+NfVQWr\SSILyD5pTKvNxtijUxE8G0QFSI+CRykYaiKRmchbkSQqlwHpglKzmvaWxc2mA0To\nzt4Nh93hqnEu6XUw2W73a9d3+GRiKi8NzFJpwgTGAGQFMUcRdUiZbhmAIQIcdEq8\n09OEH3BYTF1viODkMae+C0/MkQKBgQDVriXQ8pTLKqtZbW8AeklMacJK5YcxXhgC\nbb0pxI9XBR4R4oQDJa6XiPn6wLTFIPVnY00OMJHxYHrnJdwQshlCfv3weQsgAFwa\ndgZ3DIVbiubBN5C7e9A0XuUw0ngolDQaYmvj3IpeitIXnKuxd8zb0InWdsK79tBv\nLvK+x/FXhQKBgQC8EzY7eDzOGfV8BthlocUsMb34dPFKh/8U6uESme/DKw7Szqsl\n+kSv5CHeFJDL4CujAFk31ox4kZYk3z4B60WB5+eDGhfDCOoFCbffRF7JKz4F+a5h\necwsi3p+nJcGUjBS5GUFGXwRJ2ToTYyi5HCD7h5Pt1fE2zZteZtGnFk48QKBgFGq\nH+vOek13fktMRqshEVhx5v6m4FdexcBP3obTB5FTdF2Te66UPTjO8fMCqVPZt9CO\npAlzSKO+otoqnwOGfZ7rV/QK3tSZLpoyV2AyWdlVqcFYkikFNdp+FgvltGSV15/p\n06AfToa5eXfqube2uIWeGr/rXZtmxdxoTf/Z/IPdAoGBALtiNEV4hrb7/p0+90sy\nR5wQDfQiPztTEM0QzQJ+LDRNL3DQ/p0NQ0EYdTZ56Xt4WcWvIvOBn5ynFDnlWfmw\nIL7oW5kvwyFaz08IK2n33DLSXI5yWEWGbDEXy64QInD4GAxCMBdyOlezIQmG+cCc\ngRBdBBCQGar6llpxl37JSDwz\n-----END PRIVATE KEY-----";

let content = fs.readFileSync(envPath, 'utf8');
const lines = content.split('\n');

const updatedLines = lines.map(line => {
    if (line.startsWith('GOOGLE_DRIVE_PRIVATE_KEY=')) {
        return `GOOGLE_DRIVE_PRIVATE_KEY="${fullKey}"`;
    }
    return line;
});

fs.writeFileSync(envPath, updatedLines.join('\n'));
console.log('✅ .env file updated with full private key');
