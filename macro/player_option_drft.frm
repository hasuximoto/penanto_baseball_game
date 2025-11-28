VERSION 5.00
Begin {C62A69F0-16DC-11CE-9E98-00AA00574A4F} player_option_drft 
   Caption         =   "ドラフト時の評価"
   ClientHeight    =   2655
   ClientLeft      =   50
   ClientTop       =   380
   ClientWidth     =   4330
   OleObjectBlob   =   "player_option_drft.frx":0000
   StartUpPosition =   1  'オーナー フォームの中央
End
Attribute VB_Name = "player_option_drft"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False


Private Sub Image1_Click()

Unload Me
Unload player_option

End Sub

Private Sub UserForm_Initialize()

Label1.Caption = Range("data!AG340").Value

End Sub
