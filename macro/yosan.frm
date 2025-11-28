VERSION 5.00
Begin {C62A69F0-16DC-11CE-9E98-00AA00574A4F} yosan 
   Caption         =   "収支報告"
   ClientHeight    =   4995
   ClientLeft      =   50
   ClientTop       =   440
   ClientWidth     =   4450
   OleObjectBlob   =   "yosan.frx":0000
   StartUpPosition =   1  'オーナー フォームの中央
End
Attribute VB_Name = "yosan"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False


Private Sub Image3_Click()

Unload Me

End Sub

Private Sub UserForm_Initialize()

kane1.Caption = Range("オフ動向!GD53").Value
kane2.Caption = Range("オフ動向!GD54").Value
kane4.Caption = Range("オフ動向!GD55").Value
kane5.Caption = "-" & Range("オフ動向!GD56").Value
kane6.Caption = Range("オフ動向!GD59").Value
kane7.Caption = Range("オフ動向!GD57").Value
kane8.Caption = Range("オフ動向!GD58").Value
kane9.Caption = Range("オフ動向!GE50").Value


End Sub
