VERSION 5.00
Begin {C62A69F0-16DC-11CE-9E98-00AA00574A4F} player_list 
   Caption         =   "選手リスト"
   ClientHeight    =   5610
   ClientLeft      =   50
   ClientTop       =   380
   ClientWidth     =   11400
   OleObjectBlob   =   "player_list.frx":0000
   StartUpPosition =   1  'オーナー フォームの中央
End
Attribute VB_Name = "player_list"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False
Private Sub CheckBox1_Click()

If Range("data!IR24") = "" Then
    Range("data!IR2").Value = CheckBox1.Value
    Range("data!IH1:IR1000").Calculate
    With ListBox1
        .ColumnCount = 6
        .ColumnWidths = "80;30,30,30,40,145"
        .RowSource = "data!IJ2:IP" & Range("data!II1")
        .ColumnHeads = True
        .MultiSelect = fmMultiSelectSingle
    End With
End If

End Sub

Private Sub CheckBox2_Click()

If Range("data!IR24") = "" Then
    Range("data!IR3").Value = CheckBox2.Value
    Range("data!IH1:IR1000").Calculate
    With ListBox1
        .ColumnCount = 6
        .ColumnWidths = "80;30,30,30,40,145"
        .RowSource = "data!IJ2:IP" & Range("data!II1")
        .ColumnHeads = True
        .MultiSelect = fmMultiSelectSingle
    End With
End If

End Sub

Private Sub CheckBox3_Click()

If Range("data!IR24") = "" Then
    Range("data!IR4").Value = CheckBox3.Value
    Range("data!IH1:IR1000").Calculate
    With ListBox1
        .ColumnCount = 6
        .ColumnWidths = "80;30,30,30,40,145"
        .RowSource = "data!IJ2:IP" & Range("data!II1")
        .ColumnHeads = True
        .MultiSelect = fmMultiSelectSingle
    End With
End If

End Sub

Private Sub CheckBox4_Click()

If Range("data!IR24") = "" Then
    Range("data!IR5").Value = CheckBox4.Value
    Range("data!IH1:IR1000").Calculate
    With ListBox1
        .ColumnCount = 6
        .ColumnWidths = "80;30,30,30,40,145"
        .RowSource = "data!IJ2:IP" & Range("data!II1")
        .ColumnHeads = True
        .MultiSelect = fmMultiSelectSingle
    End With
End If

End Sub

Private Sub CheckBox5_Click()

If Range("data!IR24") = "" Then
    Range("data!IR6").Value = CheckBox5.Value
    Range("data!IH1:IR1000").Calculate
    With ListBox1
        .ColumnCount = 6
        .ColumnWidths = "80;30,30,30,40,145"
        .RowSource = "data!IJ2:IP" & Range("data!II1")
        .ColumnHeads = True
        .MultiSelect = fmMultiSelectSingle
    End With
End If

End Sub

Private Sub CheckBox6_Click()

If Range("data!IR24") = "" Then
    Range("data!IR7").Value = CheckBox6.Value
    Range("data!IH1:IR1000").Calculate
    With ListBox1
        .ColumnCount = 6
        .ColumnWidths = "80;30,30,30,40,145"
        .RowSource = "data!IJ2:IP" & Range("data!II1")
        .ColumnHeads = True
        .MultiSelect = fmMultiSelectSingle
    End With
End If
End Sub

Private Sub CheckBox7_Click()

Range("data!IR8").Value = CheckBox7.Value
Range("data!IH1:IR1000").Calculate
With ListBox1
    .ColumnCount = 6
    .ColumnWidths = "80;30,30,30,40,145"
    .RowSource = "data!IJ2:IP" & Range("data!II1")
    .ColumnHeads = True
    .MultiSelect = fmMultiSelectSingle
End With

End Sub

Private Sub CheckBox8_Click()

Range("data!IR9").Value = CheckBox8.Value
Range("data!IH1:IR1000").Calculate
With ListBox1
    .ColumnCount = 6
    .ColumnWidths = "80;30,30,30,40,145"
    .RowSource = "data!IJ2:IP" & Range("data!II1")
    .ColumnHeads = True
    .MultiSelect = fmMultiSelectSingle
End With

End Sub

Private Sub CheckBox9_Click()

Range("data!IR10").Value = CheckBox9.Value
Range("data!IH1:IR1000").Calculate
With ListBox1
    .ColumnCount = 6
    .ColumnWidths = "80;30,30,30,40,145"
    .RowSource = "data!IJ2:IP" & Range("data!II1")
    .ColumnHeads = True
    .MultiSelect = fmMultiSelectSingle
End With

End Sub

Private Sub CheckBox10_Click()

Range("data!IR11").Value = CheckBox10.Value
Range("data!IH1:IR1000").Calculate
With ListBox1
    .ColumnCount = 6
    .ColumnWidths = "80;30,30,30,40,145"
    .RowSource = "data!IJ2:IP" & Range("data!II1")
    .ColumnHeads = True
    .MultiSelect = fmMultiSelectSingle
End With

End Sub

Private Sub CheckBox11_Click()

Range("data!IR12").Value = CheckBox11.Value
Range("data!IH1:IR1000").Calculate
With ListBox1
    .ColumnCount = 6
    .ColumnWidths = "80;30,30,30,40,145"
    .RowSource = "data!IJ2:IP" & Range("data!II1")
    .ColumnHeads = True
    .MultiSelect = fmMultiSelectSingle
End With

End Sub

Private Sub CheckBox12_Click()

Range("data!IR13").Value = CheckBox12.Value
Range("data!IH1:IR1000").Calculate
With ListBox1
    .ColumnCount = 6
    .ColumnWidths = "80;30,30,30,40,145"
    .RowSource = "data!IJ2:IP" & Range("data!II1")
    .ColumnHeads = True
    .MultiSelect = fmMultiSelectSingle
End With

End Sub

Private Sub CheckBox13_Click()

Range("data!IR14").Value = CheckBox13.Value
Range("data!IH1:IR1000").Calculate
With ListBox1
    .ColumnCount = 6
    .ColumnWidths = "80;30,30,30,40,145"
    .RowSource = "data!IJ2:IP" & Range("data!II1")
    .ColumnHeads = True
    .MultiSelect = fmMultiSelectSingle
End With

End Sub

Private Sub geneki_kirikae_Click()

With ListBox1
    .ColumnCount = 6
    .ColumnWidths = "80;30,30,30,40,145"
    .RowSource = "data!IJ2:IP" & Range("data!II1")
    .ColumnHeads = True
    .MultiSelect = fmMultiSelectSingle
End With

narabikae.left = 366
siborikomi.left = 468

End Sub

Private Sub intai_kirikae_Click()

With ListBox1
    .ColumnCount = 3
    .ColumnWidths = "80;30,60"
    .RowSource = "引退選手成績保管!BA3:BC" & Range("引退選手成績保管!A1").End(xlDown).Row
    .ColumnHeads = True
    .MultiSelect = fmMultiSelectSingle
End With

narabikae.left = 700
siborikomi.left = 700

End Sub

Private Sub Label1_Click()


If ListBox1.Text = "" Then
    MsgBox "選手を選択してください"
Else
    Range("data!C301").Value = ListBox1.List(ListBox1.ListIndex, 0)
    Range("data!C1103").Value = Range("data!C301").Value
    Call 選手データオープン
End If


End Sub

Private Sub Label2_Click()

Range("data!IR2").Value = True
Range("data!IR3").Value = True
Range("data!IR4").Value = True
Range("data!IR5").Value = True
Range("data!IR6").Value = True
Range("data!IR7").Value = True
Range("data!IR8").Value = False
Range("data!IR9").Value = False
Range("data!IR10").Value = False
Range("data!IR11").Value = False
Range("data!IR12").Value = True
Range("data!IR13").Value = True
Range("data!IR14").Value = False
Range("data!IR17").Value = 1

Unload Me

End Sub


Private Sub OptionButton1_Click()

Range("data!IR17").Value = 1
Range("data!IH1:IR1000").Calculate
With ListBox1
    .ColumnCount = 6
    .ColumnWidths = "80;30,30,30,40,145"
    .RowSource = "data!IJ2:IP" & Range("data!II1")
    .ColumnHeads = True
    .MultiSelect = fmMultiSelectSingle
End With

End Sub

Private Sub OptionButton2_Click()

Range("data!IR17").Value = 2
Range("data!IH1:IR1000").Calculate
With ListBox1
    .ColumnCount = 6
    .ColumnWidths = "80;30,30,30,40,145"
    .RowSource = "data!IJ2:IP" & Range("data!II1")
    .ColumnHeads = True
    .MultiSelect = fmMultiSelectSingle
End With

End Sub

Private Sub OptionButton3_Click()

Range("data!IR17").Value = 3
Range("data!IH1:IR1000").Calculate
With ListBox1
    .ColumnCount = 6
    .ColumnWidths = "80;30,30,30,40,145"
    .RowSource = "data!IJ2:IP" & Range("data!II1")
    .ColumnHeads = True
    .MultiSelect = fmMultiSelectSingle
End With

End Sub
Private Sub OptionButton4_Click()

Range("data!IR17").Value = 4
Range("data!IH1:IR1000").Calculate
With ListBox1
    .ColumnCount = 6
    .ColumnWidths = "80;30,30,30,40,145"
    .RowSource = "data!IJ2:IP" & Range("data!II1")
    .ColumnHeads = True
    .MultiSelect = fmMultiSelectSingle
End With

End Sub
Private Sub OptionButton5_Click()

Range("data!IR17").Value = 5
Range("data!IH1:IR1000").Calculate
With ListBox1
    .ColumnCount = 6
    .ColumnWidths = "80;30,30,30,40,145"
    .RowSource = "data!IJ2:IP" & Range("data!II1")
    .ColumnHeads = True
    .MultiSelect = fmMultiSelectSingle
End With

End Sub


Private Sub UserForm_QueryClose(Cancel As Integer, CloseMode As Integer)

Range("data!IR2").Value = True
Range("data!IR3").Value = True
Range("data!IR4").Value = True
Range("data!IR5").Value = True
Range("data!IR6").Value = True
Range("data!IR7").Value = True
Range("data!IR8").Value = False
Range("data!IR9").Value = False
Range("data!IR10").Value = False
Range("data!IR11").Value = False
Range("data!IR12").Value = True
Range("data!IR13").Value = True
Range("data!IR14").Value = False
Range("data!IR17").Value = 4

End Sub


Private Sub UserForm_Initialize()

'Range("data!IR24") = ""
Range("data!IH1:IR1000").Calculate

CheckBox1.Caption = Range("チーム情報!B3") & "所属"
CheckBox2.Caption = Range("チーム情報!C3") & "所属"
CheckBox3.Caption = Range("チーム情報!D3") & "所属"
CheckBox4.Caption = Range("チーム情報!E3") & "所属"
CheckBox5.Caption = Range("チーム情報!F3") & "所属"
CheckBox6.Caption = Range("チーム情報!G3") & "所属"

With ListBox1
    .ColumnCount = 6
    .ColumnWidths = "80;30,30,30,40,145"
    .RowSource = "data!IJ2:IP" & Range("data!II1")
    .ColumnHeads = True
    .MultiSelect = fmMultiSelectSingle
End With

End Sub
