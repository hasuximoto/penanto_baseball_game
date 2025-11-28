VERSION 5.00
Begin {C62A69F0-16DC-11CE-9E98-00AA00574A4F} UserForm27 
   Caption         =   "各球団指名"
   ClientHeight    =   5640
   ClientLeft      =   50
   ClientTop       =   440
   ClientWidth     =   6000
   OleObjectBlob   =   "UserForm27.frx":0000
   StartUpPosition =   1  'オーナー フォームの中央
End
Attribute VB_Name = "UserForm27"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False
Private Declare Sub Sleep Lib "kernel32" (ByVal dwMilliseconds As Long)

Private Sub Label8_Click()

End Sub

Private Sub UserForm_QueryClose(Cancel As Integer, CloseMode As Integer)
    If CloseMode = vbFormControlMenu Then
        MsgBox "次に進むには画面をクリックしてください。途中で閉じることは出来ません。"
        Cancel = True
    End If
End Sub


Private Sub UserForm_Activate()

draft_kaigi.junme.Caption = Range("ドラフト会議!ff22").Value

'指名おわり？
If Range("ドラフト会議!FA28") = 1 Then

Unload Me
MsgBox "ドラフト会議の全指名を終えました。"


'Range("ストーブリーグ!A1").Select
Call ドラフト指名選手入団


Unload draft_kaigi
stove_league.Show


Label20.Top = 30
Label21.Top = 0

Else

Dim A2 As Long
Dim B2 As Long


'2順目以降で自分の指名をした直後なら、その表示
If Range("ドラフト会議!EW16") = 1 Then

        Label14.Caption = Range("ドラフト会議!EZ25")
        Label15.Caption = Range("ドラフト会議!FA25")
        Label16.Caption = Range("ドラフト会議!FB25")
        Label17.Caption = Range("ドラフト会議!FC25")
        Label18.Caption = Range("ドラフト会議!FD25")
        Label19.Caption = Range("ドラフト会議!FE25")
        
        UserForm27.Repaint
        
        '選択終了？
        If Range("ドラフト会議!FA29") = "指名終了" Then
            Label9.Caption = Range("ドラフト会議!ET16")
            Label10.Caption = "選択終了"
            Label12.Caption = Range("ドラフト会議!ET16")
            Label22.Caption = ""
        Else
            Label9.Caption = Range("ドラフト会議!ET16")
            Label10.Caption = Range("ドラフト会議!FQ1")
            Label12.Caption = Range("ドラフト会議!ET16")
            Label22.Caption = Range("ドラフト会議!FQ4")
        End If
        
        Label12.Top = 68
        
            'Sleep 1000
            'DoEvents
        
        Label12.Top = 300
        
            'Sleep 1000
            'DoEvents

            For A2 = 1 To 20
            
            Label11.Width = 276 - A2 * 13.8
            Label11.left = 12 + A2 * 7
            
            'Sleep 50
            'DoEvents
            
            Next
            
            For B2 = 1 To 3
                    '選択終了？
                    If Range("ドラフト会議!FA29") = "指名終了" Then
                    
                                                If Range("ドラフト会議!EW17") = 0 Then  '上位チームから進むとき
                        
                            If Range("ドラフト会議!FA27") = 1 Then
                            Label14.Caption = " "
                            ElseIf Range("ドラフト会議!FA27") = 2 Then
                            Label15.Caption = " "
                            ElseIf Range("ドラフト会議!FA27") = 3 Then
                            Label16.Caption = " "
                            ElseIf Range("ドラフト会議!FA27") = 4 Then
                            Label17.Caption = " "
                            ElseIf Range("ドラフト会議!FA27") = 5 Then
                            Label18.Caption = " "
                            ElseIf Range("ドラフト会議!FA27") = 6 Then
                            Label19.Caption = " "
                            End If
                                    
                            
                               
                            'Sleep 300
                            'DoEvents
                            
                            If Range("ドラフト会議!FA27") = 1 Then
                            Label14.Caption = "選択終了"
                            ElseIf Range("ドラフト会議!FA27") = 2 Then
                            Label15.Caption = "選択終了"
                            ElseIf Range("ドラフト会議!FA27") = 3 Then
                            Label16.Caption = "選択終了"
                            ElseIf Range("ドラフト会議!FA27") = 4 Then
                            Label17.Caption = "選択終了"
                            ElseIf Range("ドラフト会議!FA27") = 5 Then
                            Label18.Caption = "選択終了"
                            ElseIf Range("ドラフト会議!FA27") = 6 Then
                            Label19.Caption = "選択終了"
                            End If
                                    
                              
                            'Sleep 300
                            'DoEvents
                            
                        Else  '逆順で進むとき
                        
                            If Range("ドラフト会議!FA27") = 1 Then
                            Label19.Caption = " "
                            ElseIf Range("ドラフト会議!FA27") = 2 Then
                            Label18.Caption = " "
                            ElseIf Range("ドラフト会議!FA27") = 3 Then
                            Label17.Caption = " "
                            ElseIf Range("ドラフト会議!FA27") = 4 Then
                            Label16.Caption = " "
                            ElseIf Range("ドラフト会議!FA27") = 5 Then
                            Label15.Caption = " "
                            ElseIf Range("ドラフト会議!FA27") = 6 Then
                            Label14.Caption = " "
                            End If
                                    
                            
                            'Sleep 300
                            'DoEvents
                            
                            If Range("ドラフト会議!FA27") = 1 Then
                            Label19.Caption = "選択終了"
                            ElseIf Range("ドラフト会議!FA27") = 2 Then
                            Label18.Caption = "選択終了"
                            ElseIf Range("ドラフト会議!FA27") = 3 Then
                            Label17.Caption = "選択終了"
                            ElseIf Range("ドラフト会議!FA27") = 4 Then
                            Label16.Caption = "選択終了"
                            ElseIf Range("ドラフト会議!FA27") = 5 Then
                            Label15.Caption = "選択終了"
                            ElseIf Range("ドラフト会議!FA27") = 6 Then
                            Label14.Caption = "選択終了"
                            End If
                                    
                                
                            'Sleep 300
                            'DoEvents
                            
                        End If
                    
                    Else
                    
                        If Range("ドラフト会議!EW17") = 0 Then  '上位チームから進むとき
                        
                            If Range("ドラフト会議!FA27") = 1 Then
                            Label14.Caption = " "
                            ElseIf Range("ドラフト会議!FA27") = 2 Then
                            Label15.Caption = " "
                            ElseIf Range("ドラフト会議!FA27") = 3 Then
                            Label16.Caption = " "
                            ElseIf Range("ドラフト会議!FA27") = 4 Then
                            Label17.Caption = " "
                            ElseIf Range("ドラフト会議!FA27") = 5 Then
                            Label18.Caption = " "
                            ElseIf Range("ドラフト会議!FA27") = 6 Then
                            Label19.Caption = " "
                            End If
                              
                            
                            'Sleep 300
                            'DoEvents
                            
                            If Range("ドラフト会議!FA27") = 1 Then
                            Label14.Caption = Range("ドラフト会議!FQ1")
                            ElseIf Range("ドラフト会議!FA27") = 2 Then
                            Label15.Caption = Range("ドラフト会議!FQ1")
                            ElseIf Range("ドラフト会議!FA27") = 3 Then
                            Label16.Caption = Range("ドラフト会議!FQ1")
                            ElseIf Range("ドラフト会議!FA27") = 4 Then
                            Label17.Caption = Range("ドラフト会議!FQ1")
                            ElseIf Range("ドラフト会議!FA27") = 5 Then
                            Label18.Caption = Range("ドラフト会議!FQ1")
                            ElseIf Range("ドラフト会議!FA27") = 6 Then
                            Label19.Caption = Range("ドラフト会議!FQ1")
                            End If
                                    
                            
                            'Sleep 300
                            'DoEvents
                            
                        Else  '逆順で進むとき
                        
                            If Range("ドラフト会議!FA27") = 1 Then
                            Label19.Caption = " "
                            ElseIf Range("ドラフト会議!FA27") = 2 Then
                            Label18.Caption = " "
                            ElseIf Range("ドラフト会議!FA27") = 3 Then
                            Label17.Caption = " "
                            ElseIf Range("ドラフト会議!FA27") = 4 Then
                            Label16.Caption = " "
                            ElseIf Range("ドラフト会議!FA27") = 5 Then
                            Label15.Caption = " "
                            ElseIf Range("ドラフト会議!FA27") = 6 Then
                            Label14.Caption = " "
                            End If
                                    
                            
                            'Sleep 300
                            'DoEvents
                            
                            If Range("ドラフト会議!FA27") = 1 Then
                            Label19.Caption = Range("ドラフト会議!FQ1")
                            ElseIf Range("ドラフト会議!FA27") = 2 Then
                            Label18.Caption = Range("ドラフト会議!FQ1")
                            ElseIf Range("ドラフト会議!FA27") = 3 Then
                            Label17.Caption = Range("ドラフト会議!FQ1")
                            ElseIf Range("ドラフト会議!FA27") = 4 Then
                            Label16.Caption = Range("ドラフト会議!FQ1")
                            ElseIf Range("ドラフト会議!FA27") = 5 Then
                            Label15.Caption = Range("ドラフト会議!FQ1")
                            ElseIf Range("ドラフト会議!FA27") = 6 Then
                            Label14.Caption = Range("ドラフト会議!FQ1")
                            End If
                                    
                            main_menu.Repaint
                            'Sleep 300
                            'DoEvents
                            
                        End If
                    End If
                    
            Next

End If
                    
UserForm27.Repaint
                    
Sheets("ドラフト会議").Calculate

Range("ドラフト会議!FC7") = ""

If Range("ドラフト会議!FA7") = 1 Then 'すでに一位指名が確定している球団は最初から表示
Label14.Caption = Range("ドラフト会議!ES4")
Label15.Caption = Range("ドラフト会議!ET4")
Label16.Caption = Range("ドラフト会議!EU4")
Label17.Caption = Range("ドラフト会議!EV4")
Label18.Caption = Range("ドラフト会議!EW4")
Label19.Caption = Range("ドラフト会議!EX4")
Else '二巡目以降で指名が確定している球団は最初から表示
Label14.Caption = Range("ドラフト会議!EZ25")
Label15.Caption = Range("ドラフト会議!FA25")
Label16.Caption = Range("ドラフト会議!FB25")
Label17.Caption = Range("ドラフト会議!FC25")
Label18.Caption = Range("ドラフト会議!FD25")
Label19.Caption = Range("ドラフト会議!FE25")
End If

Label20.Top = 300
Label21.Top = 300

Dim t As Long
Dim a As Long
Dim b  As Long

For t = 1 To Range("ドラフト会議!EV18")

    '一位指名以外は毎回更新
    If Not Range("ドラフト会議!FA7") = 1 Then
    Sheets("ドラフト会議").Calculate
    End If
    
    '自チームのとき止めてから選ばせる
    If Range("ドラフト会議!EW16") = 1 And Not Range("ドラフト会議!FA29") = "指名終了" Then
        
        't=6になるまで連続で表示されるのでその防止
        
        If Range("ドラフト会議!FC7") = 1 Then
        Else
            MsgBox Range("ドラフト会議!FB7") & "巡目の指名を行ってください。"
            Unload Me
            't=いくらで終わったか記録
            If Range("ドラフト会議!FA27") = "" Then
            Range("ドラフト会議!FA27") = t
            End If
        End If
        
        Range("ドラフト会議!FC7") = 1
    
    Else

        'すでに一位指名されてたら回避
        If Range("ドラフト会議!FA7") = 1 And Range("ドラフト会議!FG" & t + 7) = 0 Or Not Range("ドラフト会議!FA7") = 1 Then
            If Range("ドラフト会議!EW18") = 1 Then
                Range(Range("ドラフト会議!ET18").Value).Value = Range("ドラフト会議!ET17").Value
                Range("ドラフト会議!D18") = "" '条件付き書式更新
            Else
            Label11.Width = 276
            Label11.left = 12
            
            If Range("ドラフト会議!FA7") = 1 Then '一位のとき
            Label9.Caption = Range("ドラフト会議!FA" & t)
            Label10.Caption = Range("ドラフト会議!FA" & t + 7)
            Label12.Caption = Range("ドラフト会議!FA" & t)
            Label22.Caption = Range("ドラフト会議!FB" & t + 7)
            Else  '一位以外　即交渉権確定
            Label9.Caption = Range("ドラフト会議!ET16")
            Label10.Caption = Range("ドラフト会議!ET17")
            Label12.Caption = Range("ドラフト会議!ET16")
            Label22.Caption = Range("ドラフト会議!EU17")
            Range(Range("ドラフト会議!ET18").Value).Value = Range("ドラフト会議!ET17").Value
            Range("ドラフト会議!D18") = "" '条件付き書式更新
            End If
            
            Label12.Top = 68
            
                'Sleep 1000
                'DoEvents
            
            Label12.Top = 300
            
                'Sleep 1000
                'DoEvents
            
                For a = 1 To 20
                
                Label11.Width = 276 - a * 13.8
                Label11.left = 12 + a * 7
                
                'Sleep 50
                'DoEvents
                
                Next
            
                For b = 1 To 3
                    
                    If Range("ドラフト会議!FA7") = 1 Then '一位指名のとき
                    
                            If t = 1 Then
                            Label14.Caption = " "
                            ElseIf t = 2 Then
                            Label15.Caption = " "
                            ElseIf t = 3 Then
                            Label16.Caption = " "
                            ElseIf t = 4 Then
                            Label17.Caption = " "
                            ElseIf t = 5 Then
                            Label18.Caption = " "
                            ElseIf t = 6 Then
                            Label19.Caption = " "
                            End If
                                    
                            'Sleep 300
                            'DoEvents
                            
                            If t = 1 Then
                            Label14.Caption = Range("ドラフト会議!FA" & t + 7)
                            ElseIf t = 2 Then
                            Label15.Caption = Range("ドラフト会議!FA" & t + 7)
                            ElseIf t = 3 Then
                            Label16.Caption = Range("ドラフト会議!FA" & t + 7)
                            ElseIf t = 4 Then
                            Label17.Caption = Range("ドラフト会議!FA" & t + 7)
                            ElseIf t = 5 Then
                            Label18.Caption = Range("ドラフト会議!FA" & t + 7)
                            ElseIf t = 6 Then
                            Label19.Caption = Range("ドラフト会議!FA" & t + 7)
                            End If
                                    
                            'Sleep 300
                            'DoEvents
                    
                    Else
                    
                        If Range("EW17") = 0 Then  '上位チームから進むとき
                        
                            If t + Range("ドラフト会議!FA27") = 1 Then
                            Label14.Caption = " "
                            ElseIf t + Range("ドラフト会議!FA27") = 2 Then
                            Label15.Caption = " "
                            ElseIf t + Range("ドラフト会議!FA27") = 3 Then
                            Label16.Caption = " "
                            ElseIf t + Range("ドラフト会議!FA27") = 4 Then
                            Label17.Caption = " "
                            ElseIf t + Range("ドラフト会議!FA27") = 5 Then
                            Label18.Caption = " "
                            ElseIf t + Range("ドラフト会議!FA27") = 6 Then
                            Label19.Caption = " "
                            End If
                                    
                            'Sleep 300
                            'DoEvents
                            
                            If t + Range("ドラフト会議!FA27") = 1 Then
                            Label14.Caption = Range("ドラフト会議!ET17")
                            ElseIf t + Range("ドラフト会議!FA27") = 2 Then
                            Label15.Caption = Range("ドラフト会議!ET17")
                            ElseIf t + Range("ドラフト会議!FA27") = 3 Then
                            Label16.Caption = Range("ドラフト会議!ET17")
                            ElseIf t + Range("ドラフト会議!FA27") = 4 Then
                            Label17.Caption = Range("ドラフト会議!ET17")
                            ElseIf t + Range("ドラフト会議!FA27") = 5 Then
                            Label18.Caption = Range("ドラフト会議!ET17")
                            ElseIf t + Range("ドラフト会議!FA27") = 6 Then
                            Label19.Caption = Range("ドラフト会議!ET17")
                            End If
                                    
                            'Sleep 300
                            'DoEvents
                            
                        Else  '逆順で進むとき
                        
                            If t + Range("ドラフト会議!FA27") = 1 Then
                            Label19.Caption = " "
                            ElseIf t + Range("ドラフト会議!FA27") = 2 Then
                            Label18.Caption = " "
                            ElseIf t + Range("ドラフト会議!FA27") = 3 Then
                            Label17.Caption = " "
                            ElseIf t + Range("ドラフト会議!FA27") = 4 Then
                            Label16.Caption = " "
                            ElseIf t + Range("ドラフト会議!FA27") = 5 Then
                            Label15.Caption = " "
                            ElseIf t + Range("ドラフト会議!FA27") = 6 Then
                            Label14.Caption = " "
                            End If
                                    
                            'Sleep 300
                            'DoEvents
                            
                            If t + Range("ドラフト会議!FA27") = 1 Then
                            Label19.Caption = Range("ドラフト会議!ET17")
                            ElseIf t + Range("ドラフト会議!FA27") = 2 Then
                            Label18.Caption = Range("ドラフト会議!ET17")
                            ElseIf t + Range("ドラフト会議!FA27") = 3 Then
                            Label17.Caption = Range("ドラフト会議!ET17")
                            ElseIf t + Range("ドラフト会議!FA27") = 4 Then
                            Label16.Caption = Range("ドラフト会議!ET17")
                            ElseIf t + Range("ドラフト会議!FA27") = 5 Then
                            Label15.Caption = Range("ドラフト会議!ET17")
                            ElseIf t + Range("ドラフト会議!FA27") = 6 Then
                            Label14.Caption = Range("ドラフト会議!ET17")
                            End If
                                    
                            'Sleep 300
                            'DoEvents
                            
                        End If
                    
                    End If
                Next
            End If
        End If
    End If

Next

Label20.Caption = Range("ドラフト会議!FE8") & Range("ドラフト会議!FE9") & Range("ドラフト会議!FE10") & Range("ドラフト会議!FE11") & Range("ドラフト会議!FE12") & Range("ドラフト会議!FE13") & Range("ドラフト会議!FE14")

Label20.Top = 30
Label21.Top = 0

End If

UserForm27.Repaint
Range("ドラフト会議!ff22").Calculate

End Sub
Sub Label21_click()

Unload Me

'一指名のとき，重複がない選手は交渉権確定
If Range("ドラフト会議!FA7") = 1 Then
    Range("ドラフト会議!ES4").Value = Range("ドラフト会議!FF8").Value
    Range("ドラフト会議!ET4").Value = Range("ドラフト会議!FF9").Value
    Range("ドラフト会議!EU4").Value = Range("ドラフト会議!FF10").Value
    Range("ドラフト会議!EV4").Value = Range("ドラフト会議!FF11").Value
    Range("ドラフト会議!EW4").Value = Range("ドラフト会議!FF12").Value
    Range("ドラフト会議!EX4").Value = Range("ドラフト会議!FF13").Value
End If

Sheets("ドラフト会議").Calculate

'自分のチームの最初の指名けす
Range("ドラフト会議!FA14") = ""

If Range("ドラフト会議!FA15") = "クジ" Then
    MsgBox "一位指名で重複した選手の抽選を行います。"
    UserForm29.Show
End If

'その巡の指名が終わってたら、次の順に移る
If Range("ドラフト会議!EZ20") = 1 Then
    Range("ドラフト会議!FA27") = ""
    Range("ドラフト会議!FA7") = Range("ドラフト会議!FA7") + 1
    Sheets("ドラフト会議").Calculate
    MsgBox Range("ドラフト会議!FB7") & "巡目の指名に移ります。"
    UserForm27.Show
End If

draft_kaigi.junme.Caption = Range("ドラフト会議!ff22").Value

End Sub


Private Sub UserForm_Initialize()

Controls("Image" & Range("チーム情報!B12").Value).Top = Range("ドラフト会議!FE1")
Controls("Image" & Range("チーム情報!B12").Value).left = Range("ドラフト会議!FF1")

Controls("Image" & Range("チーム情報!C12").Value).Top = Range("ドラフト会議!FE2")
Controls("Image" & Range("チーム情報!C12").Value).left = Range("ドラフト会議!FF2")

Controls("Image" & Range("チーム情報!D12").Value).Top = Range("ドラフト会議!FE3")
Controls("Image" & Range("チーム情報!D12").Value).left = Range("ドラフト会議!FF3")

Controls("Image" & Range("チーム情報!E12").Value).Top = Range("ドラフト会議!FE4")
Controls("Image" & Range("チーム情報!E12").Value).left = Range("ドラフト会議!FF4")

Controls("Image" & Range("チーム情報!F12").Value).Top = Range("ドラフト会議!FE5")
Controls("Image" & Range("チーム情報!F12").Value).left = Range("ドラフト会議!FF5")

Controls("Image" & Range("チーム情報!G12").Value).Top = Range("ドラフト会議!FE6")
Controls("Image" & Range("チーム情報!G12").Value).left = Range("ドラフト会議!FF6")

Label8.Caption = "第" & Range("ドラフト会議!FB7") & "回選択希望選手"

Label8.TextAlign = 2
Label10.TextAlign = 2
Label12.TextAlign = 2
Label22.TextAlign = 2


End Sub

Sub tes()

Label20.Caption = Range("ドラフト会議!FE8") & Range("ドラフト会議!FE9") & Range("ドラフト会議!FE10") & Range("ドラフト会議!FE11") & Range("ドラフト会議!FE12") & Range("ドラフト会議!FE13") & Range("ドラフト会議!FE14")

End Sub

