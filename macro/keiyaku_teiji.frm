VERSION 5.00
Begin {C62A69F0-16DC-11CE-9E98-00AA00574A4F} keiyaku_teiji 
   Caption         =   "契約条件提示"
   ClientHeight    =   3720
   ClientLeft      =   50
   ClientTop       =   380
   ClientWidth     =   6960
   OleObjectBlob   =   "keiyaku_teiji.frx":0000
   StartUpPosition =   1  'オーナー フォームの中央
End
Attribute VB_Name = "keiyaku_teiji"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False
Private Sub keiyaku_teiji_Click()

If Not Range("data!D1103") = "" Then
    '残留交渉
    Range("data!D1103") = ""
    Range(Range("data!C1105")).Value = Range("data!E1103").Value
    Range(Range("data!D1105")).Value = Range("data!F1103").Value
    Range("data!A1000:BZ1105").Calculate
    Unload Me
    Unload player_data
Else
    'ストーブ
    If Range("data!P1113").Value > 70 Then
        MsgBox "条件提示中の選手を含めると選手数が70名を超えます。オファーできません。"
    Else
        If Range("data!F1103").Value > Range("data!O1113").Value Then
            MsgBox "予算オーバーです。この条件では提示できません。（予算残り" & Range("data!O1114").Value & "）"
        Else
            Range("data!A1102:Z1105").Calculate
            Range(Range("data!H1105")).Value = Range("data!G1105").Value
            Range(Range("data!J1105")).Value = Range("data!J1103").Value
            Unload Me
            Unload player_data
        End If
    End If
End If

End Sub


Private Sub Label5_Click()

Unload Me

End Sub

Private Sub SpinButton1_Change()

Range("data!E1103").Value = SpinButton1.Value
Range("data!A1102:BZ1104").Calculate
nensu.Caption = Range("data!E1104").Value
nenpo.Caption = Range("data!F1104").Value
star.Width = Range("data!G1103") * 20

End Sub

Private Sub SpinButton2_Change()

Range("data!F1103").Value = SpinButton2.Value
Range("data!A1102:BZ1104").Calculate
nensu.Caption = Range("data!E1104").Value
nenpo.Caption = Range("data!F1104").Value
star.Width = Range("data!G1103") * 20

End Sub
Private Sub UserForm_Initialize()

player_name.Caption = Range("data!C1103").Value
nensu.Caption = Range("data!E1104").Value
nenpo.Caption = Range("data!F1104").Value
star.Width = Range("data!G1103") * 20

SpinButton1.Value = Range("data!E1103").Value
SpinButton2.Value = Range("data!F1103").Value
If Not Range("data!D1103") = "" Then
    SpinButton2.Min = Range("data!D1103").Value
End If

End Sub

