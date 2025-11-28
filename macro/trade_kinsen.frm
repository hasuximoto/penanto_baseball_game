VERSION 5.00
Begin {C62A69F0-16DC-11CE-9E98-00AA00574A4F} trade_kinsen 
   Caption         =   "金銭条件"
   ClientHeight    =   1815
   ClientLeft      =   50
   ClientTop       =   380
   ClientWidth     =   4930
   OleObjectBlob   =   "trade_kinsen.frx":0000
   StartUpPosition =   1  'オーナー フォームの中央
End
Attribute VB_Name = "trade_kinsen"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False

Private Sub kettei_Click()

If Range("FA選手!DQ182").Value = 1 Then
    Range("FA選手!DR180").Value = Range("FA選手!DQ184").Value
Else
    Range("FA選手!DR184").Value = Range("FA選手!DQ184").Value
End If
Unload Me

End Sub

Private Sub kyanseru_Click()

Unload Me

End Sub

Private Sub SpinButton1_Change()

Range("FA選手!DQ184").Value = SpinButton1.Value
Range("FA選手!DQ183").Calculate
kinsen.Caption = Range("FA選手!DQ183").Value

End Sub

Private Sub UserForm_Initialize()

Range("FA選手!DQ183").Calculate
kinsen.Caption = Range("FA選手!DQ183").Value

End Sub
