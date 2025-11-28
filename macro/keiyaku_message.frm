VERSION 5.00
Begin {C62A69F0-16DC-11CE-9E98-00AA00574A4F} keiyaku_message 
   Caption         =   "メッセージ"
   ClientHeight    =   2925
   ClientLeft      =   50
   ClientTop       =   440
   ClientWidth     =   5890
   OleObjectBlob   =   "keiyaku_message.frx":0000
   StartUpPosition =   1  'オーナー フォームの中央
End
Attribute VB_Name = "keiyaku_message"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False


Private Sub Image1_Click()

Unload Me

End Sub

Private Sub UserForm_Initialize()

player_name.Caption = Range("data!C" & Range("data!K1103").Value).Value
message.Caption = Range("data!BU" & Range("data!K1103").Value).Value
If Range("data!BH" & Range("data!K1103").Value).Value = Range("data!K1120") Then
    keiyaku_seiko.left = 63
ElseIf Not Range("data!BH" & Range("data!K1103").Value).Value = "" Then
    keiyaku_sippai.left = 63
End If
End Sub
