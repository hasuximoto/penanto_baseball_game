VERSION 5.00
Begin {C62A69F0-16DC-11CE-9E98-00AA00574A4F} trade_tachi 
   Caption         =   "トレード交渉"
   ClientHeight    =   5115
   ClientLeft      =   50
   ClientTop       =   440
   ClientWidth     =   6970
   OleObjectBlob   =   "trade_tachi.frx":0000
   StartUpPosition =   1  'オーナー フォームの中央
End
Attribute VB_Name = "trade_tachi"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False


Private Sub add1_Click()

Range("FA選手!DM182").Value = Range("FA選手!DO168").Value
Range("FA選手!DM183:DV282").Calculate
senshu_select.Show
Range("FA選手!DR178").Value = Range("FA選手!DQ179").Value
Range("FA選手!DQ179").Value = ""
joken1.Caption = Range("FA選手!DR178").Value
add1.left = 400
remove1.left = 126

Range("FA選手!DM168:EC184").Calculate
gm_kome.Caption = Range("FA選手!DQ174").Value
If Range("FA選手!DQ175") = True Then
    zikkou.left = 108
Else
    zikkou.left = 400
End If

End Sub

Private Sub add2_Click()

Range("FA選手!DM182").Value = Range("FA選手!DO168").Value
Range("FA選手!DM183:DV282").Calculate
senshu_select.Show
Range("FA選手!DR179").Value = Range("FA選手!DQ179").Value
Range("FA選手!DQ179").Value = ""
joken2.Caption = Range("FA選手!DR179").Value
add2.left = 400
remove2.left = 126

Range("FA選手!DM168:EC184").Calculate
gm_kome.Caption = Range("FA選手!DQ174").Value
If Range("FA選手!DQ175") = True Then
    zikkou.left = 108
Else
    zikkou.left = 400
End If

End Sub

Private Sub add4_Click()

Range("FA選手!DM182").Value = Range("FA選手!DO169").Value
Range("FA選手!DM183:DV282").Calculate
senshu_select.Show
Range("FA選手!DR182").Value = Range("FA選手!DQ179").Value
Range("FA選手!DQ179").Value = ""
joken4.Caption = Range("FA選手!DR182").Value
add4.left = 400
remove4.left = 318

Range("FA選手!DM168:EC184").Calculate
gm_kome.Caption = Range("FA選手!DQ174").Value
If Range("FA選手!DQ175") = True Then
    zikkou.left = 108
Else
    zikkou.left = 400
End If

End Sub

Private Sub add5_Click()

Range("FA選手!DM182").Value = Range("FA選手!DO169").Value
Range("FA選手!DM183:DV282").Calculate
senshu_select.Show
Range("FA選手!DR183").Value = Range("FA選手!DQ179").Value
Range("FA選手!DQ179").Value = ""
joken5.Caption = Range("FA選手!DR183").Value
add5.left = 400
remove5.left = 318

Range("FA選手!DM168:EC184").Calculate
gm_kome.Caption = Range("FA選手!DQ174").Value
If Range("FA選手!DQ175") = True Then
    zikkou.left = 108
Else
    zikkou.left = 400
End If

End Sub

Private Sub add3_Click()

Range("FA選手!DQ182").Value = 1
Range("FA選手!DQ184").Value = Range("FA選手!DR180").Value
trade_kinsen.Show
Range("FA選手!DQ180").Calculate
joken3.Caption = Range("FA選手!DQ180").Value
add3.left = 400
remove3.left = 126

Range("FA選手!DM168:EC184").Calculate
gm_kome.Caption = Range("FA選手!DQ174").Value
If Range("FA選手!DQ175") = True Then
    zikkou.left = 108
Else
    zikkou.left = 400
End If

End Sub

Private Sub add6_Click()

Range("FA選手!DQ182").Value = 2
Range("FA選手!DQ184").Value = Range("FA選手!DR184").Value
trade_kinsen.Show
Range("FA選手!DQ181").Calculate
joken6.Caption = Range("FA選手!DQ181").Value
add6.left = 400
remove6.left = 318

Range("FA選手!DM168:EC184").Calculate
gm_kome.Caption = Range("FA選手!DQ174").Value
If Range("FA選手!DQ175") = True Then
    zikkou.left = 108
Else
    zikkou.left = 400
End If

End Sub


Private Sub toziru_Click()

Unload Me

End Sub


Private Sub right_Click()

zikkou.left = 400
Range("FA選手!DN169").Value = Range("FA選手!DR169").Value
Range("FA選手!DR178:DR180").Value = ""
Range("FA選手!DR182:DR184").Value = ""
Range("FA選手!DM163:EC282").Calculate
aite_team.Caption = Range("FA選手!DN169").Value
who.Caption = Range("FA選手!DN169").Value & "GM："
gm_kome.Caption = Range("FA選手!DQ174").Value
joken1.Caption = Range("FA選手!DR178").Value
joken2.Caption = Range("FA選手!DR179").Value
joken3.Caption = Range("FA選手!DQ180").Value
joken4.Caption = Range("FA選手!DR182").Value
joken5.Caption = Range("FA選手!DR183").Value
joken6.Caption = Range("FA選手!DQ181").Value

End Sub

Private Sub left_Click()

zikkou.left = 400
Range("FA選手!DN169").Value = Range("FA選手!DQ169").Value
Range("FA選手!DR178:DR180").Value = ""
Range("FA選手!DR182:DR184").Value = ""
Range("FA選手!DM163:EC282").Calculate
aite_team.Caption = Range("FA選手!DN169").Value
who.Caption = Range("FA選手!DN169").Value & "GM："
gm_kome.Caption = Range("FA選手!DQ174").Value
joken1.Caption = Range("FA選手!DR178").Value
joken2.Caption = Range("FA選手!DR179").Value
joken3.Caption = Range("FA選手!DQ180").Value
joken4.Caption = Range("FA選手!DR182").Value
joken5.Caption = Range("FA選手!DR183").Value
joken6.Caption = Range("FA選手!DQ181").Value

End Sub



Private Sub zikkou_Click()

Dim トレード記録row As Long

Range("FA選手!DQ266:DV274").Calculate

'移籍作業
Range("選手リスト!B1:G100").Replace what:=Range("FA選手!DR178"), replacement:="", LookAt:=xlWhole, SearchOrder:=xlByRows, MatchCase:=False, SearchFormat:=False, ReplaceFormat:=False
Range("選手リスト!B1:G100").Replace what:=Range("FA選手!DR179"), replacement:="", LookAt:=xlWhole, SearchOrder:=xlByRows, MatchCase:=False, SearchFormat:=False, ReplaceFormat:=False
Range("選手リスト!B1:G100").Replace what:=Range("FA選手!DR182"), replacement:="", LookAt:=xlWhole, SearchOrder:=xlByRows, MatchCase:=False, SearchFormat:=False, ReplaceFormat:=False
Range("選手リスト!B1:G100").Replace what:=Range("FA選手!DR183"), replacement:="", LookAt:=xlWhole, SearchOrder:=xlByRows, MatchCase:=False, SearchFormat:=False, ReplaceFormat:=False
Range(Range("FA選手!DQ267").Value).Value = Range("FA選手!DQ268").Value
Range(Range("FA選手!DR267").Value).Value = Range("FA選手!DR268").Value
Range(Range("FA選手!DS267").Value).Value = Range("FA選手!DS268").Value
Range(Range("FA選手!DT267").Value).Value = Range("FA選手!DT268").Value
Range(Range("FA選手!DU267").Value).Value = Range("FA選手!DU268").Value
Range(Range("FA選手!DV267").Value).Value = Range("FA選手!DV268").Value
'記録作業
トレード記録row = 158
Do While Not Range("FA選手!DJ" & トレード記録row) = ""
    トレード記録row = トレード記録row + 1
Loop
Range("FA選手!DJ" & トレード記録row & ":DK" & トレード記録row + 3).Value = Range("FA選手!DQ271:DR274").Value

MsgBox "トレードを実行しました。"
Unload Me

stove_league.trade_koushou.left = 700

End Sub

Private Sub joken1_Click()

If Not Range("FA選手!DR178").Value = "" Then
    Range("data!C301").Value = Range("FA選手!DR178").Value
    Call 選手データオープン
End If
If Range("FA選手!DQ175") = True Then
    zikkou.left = 108
Else
    zikkou.left = 400
End If

End Sub

Private Sub joken2_Click()

If Not Range("FA選手!DR179").Value = "" Then
    Range("data!C301").Value = Range("FA選手!DR179").Value
    Call 選手データオープン
End If
If Range("FA選手!DQ175") = True Then
    zikkou.left = 108
Else
    zikkou.left = 400
End If

End Sub

Private Sub joken4_Click()

If Not Range("FA選手!DR182").Value = "" Then
    Range("data!C301").Value = Range("FA選手!DR182").Value
    Call 選手データオープン
End If
If Range("FA選手!DQ175") = True Then
    zikkou.left = 108
Else
    zikkou.left = 400
End If

End Sub

Private Sub joken5_Click()

If Not Range("FA選手!DR183").Value = "" Then
    Range("data!C301").Value = Range("FA選手!DR183").Value
    Call 選手データオープン
End If
If Range("FA選手!DQ175") = True Then
    zikkou.left = 108
Else
    zikkou.left = 400
End If

End Sub

Private Sub remove1_Click()

Range("FA選手!DR178").Value = ""
joken1.Caption = ""
add1.left = 126
remove1.left = 400

Range("FA選手!DM168:EC184").Calculate
gm_kome.Caption = Range("FA選手!DQ174").Value
If Range("FA選手!DQ175") = True Then
    zikkou.left = 108
Else
    zikkou.left = 400
End If

End Sub

Private Sub remove2_Click()

Range("FA選手!DR179").Value = ""
joken2.Caption = ""
add2.left = 126
remove2.left = 400

Range("FA選手!DM168:EC184").Calculate
gm_kome.Caption = Range("FA選手!DQ174").Value
If Range("FA選手!DQ175") = True Then
    zikkou.left = 108
Else
    zikkou.left = 400
End If

End Sub

Private Sub remove4_Click()

Range("FA選手!DR182").Value = ""
joken4.Caption = ""
add4.left = 318
remove4.left = 400

Range("FA選手!DM168:EC184").Calculate
gm_kome.Caption = Range("FA選手!DQ174").Value
If Range("FA選手!DQ175") = True Then
    zikkou.left = 108
Else
    zikkou.left = 400
End If

End Sub

Private Sub remove5_Click()

Range("FA選手!DR183").Value = ""
joken5.Caption = ""
add5.left = 318
remove5.left = 400

Range("FA選手!DM168:EC184").Calculate
gm_kome.Caption = Range("FA選手!DQ174").Value
If Range("FA選手!DQ175") = True Then
    zikkou.left = 108
Else
    zikkou.left = 400
End If

End Sub


Private Sub remove3_Click()

Range("FA選手!DR180").Value = ""
Range("FA選手!DQ180").Calculate
joken3.Caption = Range("FA選手!DQ180").Value
add3.left = 126
remove3.left = 400

Range("FA選手!DM168:EC184").Calculate
gm_kome.Caption = Range("FA選手!DQ174").Value
If Range("FA選手!DQ175") = True Then
    zikkou.left = 108
Else
    zikkou.left = 400
End If

End Sub

Private Sub remove6_Click()

Range("FA選手!DR184").Value = ""
Range("FA選手!DQ180").Calculate
joken6.Caption = Range("FA選手!DQ180").Value
add6.left = 318
remove6.left = 400

Range("FA選手!DM168:EC184").Calculate
gm_kome.Caption = Range("FA選手!DQ174").Value
If Range("FA選手!DQ175") = True Then
    zikkou.left = 108
Else
    zikkou.left = 400
End If

End Sub

Private Sub UserForm_Initialize()

zibun_team.Caption = Range("FA選手!DN168").Value
aite_team.Caption = Range("FA選手!DN169").Value
who.Caption = Range("FA選手!DN169").Value & "GM："
gm_kome.Caption = Range("FA選手!DQ174").Value
joken1.Caption = Range("FA選手!DR178").Value
joken2.Caption = Range("FA選手!DR179").Value
joken3.Caption = Range("FA選手!DQ180").Value
joken4.Caption = Range("FA選手!DR182").Value
joken5.Caption = Range("FA選手!DR183").Value
joken6.Caption = Range("FA選手!DQ181").Value

End Sub
