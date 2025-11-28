VERSION 5.00
Begin {C62A69F0-16DC-11CE-9E98-00AA00574A4F} UserForm29 
   Caption         =   "クジ引き抽選"
   ClientHeight    =   5160
   ClientLeft      =   50
   ClientTop       =   440
   ClientWidth     =   10890
   OleObjectBlob   =   "UserForm29.frx":0000
   StartUpPosition =   1  'オーナー フォームの中央
End
Attribute VB_Name = "UserForm29"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False
Private Declare Sub Sleep Lib "kernel32" (ByVal dwMilliseconds As Long)

Private Sub UserForm_QueryClose(Cancel As Integer, CloseMode As Integer)
    If CloseMode = vbFormControlMenu Then
        MsgBox "途中で閉じることは出来ません。自動的に消えるまで待っていてください。"
        Cancel = True
    End If
End Sub

Private Sub UserForm_Activate()

Label1.TextAlign = 2
Label2.TextAlign = 2
Label3.TextAlign = 2
Label4.TextAlign = 2
Label5.TextAlign = 2
Label6.TextAlign = 2

Image2.Top = 150


Dim a As Long
Dim b As Long

Sleep 1000
DoEvents

For a = 1 To 19

If Range("ドラフト会議!EZ18") = 1 Then
Image12.Top = 150 - a * 5
ElseIf Range("ドラフト会議!FA18") = 1 Then
Image2.Top = 150 - a * 5
ElseIf Range("ドラフト会議!FB18") = 1 Then
Image4.Top = 150 - a * 5
ElseIf Range("ドラフト会議!FC18") = 1 Then
Image6.Top = 150 - a * 5
ElseIf Range("ドラフト会議!FD18") = 1 Then
Image8.Top = 150 - a * 5
ElseIf Range("ドラフト会議!FE18") = 1 Then
Image10.Top = 150 - a * 5
End If

Image13.Top = 150 - a * 5
Image14.Top = 150 - a * 5
Image15.Top = 150 - a * 5
Image16.Top = 150 - a * 5
Image17.Top = 150 - a * 5
Image18.Top = 150 - a * 5

Sleep 50
DoEvents
    
Next

For b = 1 To 3

Label8.Caption = Range("ドラフト会議!FB16") & "が交渉権獲得"

Sleep 300
DoEvents

Label8.Caption = ""

Sleep 300
DoEvents

Next

Label8.Caption = Range("ドラフト会議!FB16") & "が交渉権獲得"



'交渉権確定
Range(Range("ドラフト会議!FC16").Value).Value = Range("ドラフト会議!EZ16").Value

'はずした球団は一位指名から指名選手削除
Range(Range("ドラフト会議!EZ19").Value) = ""
Range(Range("ドラフト会議!FA19").Value) = ""
Range(Range("ドラフト会議!FB19").Value) = ""
Range(Range("ドラフト会議!FC19").Value) = ""
Range(Range("ドラフト会議!FD19").Value) = ""
Range(Range("ドラフト会議!FE19").Value) = ""

'再更新
Sheets("ドラフト会議").Calculate





'次にすすむ
Unload Me

'まだ競合があるならそれをやる
If Range("ドラフト会議!FA15") = "クジ" Then
UserForm29.Show
End If

'競合がなくなったら外した球団が外れ一位を設定
Range("ドラフト会議!FA8:FA13").Value = Range("ドラフト会議!EY8:EY13").Value


'再更新
Sheets("ドラフト会議").Calculate

'自球団は外れ一位選ぶ必要ある？
If Range("ドラフト会議!FC15") = 1 Then
MsgBox "外れ一位の指名を行ってください。"
Else
'ない場合は先に進める
UserForm27.Show
End If


End Sub

Private Sub UserForm_Initialize()


Label7.Caption = Range("ドラフト会議!EZ16") & " の交渉権抽選"
UserForm29.Width = 8 + Range("ドラフト会議!FA16") * 90

Label1.Caption = Range("ドラフト会議!EZ17")
Label2.Caption = Range("ドラフト会議!FA17")
Label3.Caption = Range("ドラフト会議!FB17")
Label4.Caption = Range("ドラフト会議!FC17")
Label5.Caption = Range("ドラフト会議!FD17")
Label6.Caption = Range("ドラフト会議!FE17")

End Sub
